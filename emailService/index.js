const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_KEY);

let Bookshelf;
const knex = require("knex")({
  client: "mysql",
  connection: {
    host: "us-cdbr-iron-east-03.cleardb.net",
    user: "bb41eedfd379a8",
    password: process.env.clearDB_password,
    database: "heroku_9b6f95eb7a9adf8",
    charset: "utf8"
  },
  migrations: {
    tableName: "knex_migrations"
  }
}); // require knex query binder
Bookshelf = require("bookshelf")(knex); // require Bookshelf ORM Framework

// DEFINE MODELS
const Models = require("./bookshelfModels.js")(Bookshelf);

// GENERATE EMAIL ARRAY
const successIDs = [];

let totalErrors = 0;

async function buildEmailArr() {
  const emailArr = {};
  try {
    const result = await knex.raw(
      "select u.id as userId, u.vorname, u.name, u.email, t.name as tournamentName, r.price_owed - r.price_paid as debt, r.id as registrationId from users as u join tournaments_users r on r.user_id = u.id join tournaments as t on t.id = r.tournament_id where u.last_mail < '2019-07-19' and r.price_paid is not null and r.price_owed is not null and r.price_owed != r.price_paid limit 10;"
    );
    const debtfulRegistrations = JSON.parse(JSON.stringify(result))[0];
    return debtfulRegistrations.reduce(
      (
        emailObject,
        { userId, vorname, name, email, tournamentName, debt, registrationId },
        i
      ) => {
        // add user to emailObject if not yet there
        if (!(userId in emailObject)) {
          emailObject[userId] = {
            vorname,
            name,
            email,
            tournaments: [],
            total_debt: 0,
            transaction_purpose: "Xu6F"
          };
        }
        // add the tournament
        emailObject[userId].tournaments.push({
          name: tournamentName,
          debt: Math.round(debt * 100) / 100
        });
        // add debt to user's total debt
        emailObject[userId].total_debt += Math.round(debt * 100) / 100;
        // add reg id to transaction_purpose
        emailObject[userId].transaction_purpose += `${registrationId}fP4x`;

        // if last item return array instead of object
        if (i === debtfulRegistrations.length - 1) {
          return Object.keys(emailObject).reduce((acc, id) => {
            if (emailObject[id].total_debt > 0)
              return [
                ...acc,
                {
                  id,
                  ...emailObject[id],
                  transaction_purpose: emailObject[id].tournaments
                    .reduce(
                      (purpose, { name }) =>
                        purpose + ` ${name.substring(0, 20)},`,
                      emailObject[id].transaction_purpose + "gT7u"
                    )
                    .slice(0, -1)
                    .substring(0, 140)
                }
              ];
            return acc;
          }, []);
        }
        return emailObject;
      },
      {}
    );
  } catch (ex) {
    console.error(ex);
    return [];
  }
}

async function sendDebtMails(emailArr) {
  if (!emailArr.length) {
    console.log("NO EMAILS TO SEND\n");
    return;
  }

  // SEND OUT EMAILS
  const messageArr = emailArr.map(function(obj) {
    return {
      to: obj.email,
      from: "finanzen@debating.de",
      subject: "BDU Tournament Debts",
      templateId: "d-e8c7e977147c40048b308050ecdff978",
      dynamic_template_data: {
        vorname: obj.vorname,
        tournaments: obj.tournaments,
        total_debt: obj.total_debt,
        transaction_purpose: obj.transaction_purpose
      }
    };
  });

  try {
    const responses = await Promise.all(
      messageArr.map(msg => sgMail.send(msg))
    );
    responses.forEach((response, i) => {
      if (response[0].statusCode !== 202) {
        console.error("Error response received");
        console.error(response);
        totalErrors++;
      } else {
        console.info(
          `\nSent email to ${emailArr[i].vorname} ${emailArr[i].name}.\n`
        );
        successIDs.push(emailArr[i].id);
      }
    });
  } catch (ex) {
    console.error(ex);
    totalErrors++;
  }
}

async function setLastMail() {
  if (successIDs.length) {
    console.log("Length of successIDs Array:", successIDs.length);

    try {
      const x = await Models.User.where("id", "IN", successIDs).save(
        { last_mail: new Date() },
        { patch: true }
      );
      console.log(x.toJSON());
      console.log("Successfully saved new last mail date.\n");
    } catch (ex) {
      console.error(ex);
    }
  }
}

function logSummary(emailArr) {
  console.log("\n ✔✔✔ Finished Sending Debt Emails ✔✔✔ \n");
  if (emailArr.length) {
    console.log(`Tried to send ${emailArr.length} emails`);
    console.log(`Success: ${successIDs.length}`);
    console.log(`Errors: ${totalErrors}`);
  }
}

exports.handler = async function execute() {
  console.log("\n ✔✔✔ Sending out Debt Emails ✔✔✔ \n");
  const emailArr = await buildEmailArr();
  await sendDebtMails(emailArr);
  await setLastMail();
  logSummary(emailArr);
};
