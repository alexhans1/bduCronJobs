const conn = require("./knexfile.js"); // read out the DB Conn Data
const knex = require("knex")(conn.clearDB); // require knex query binder
const Bookshelf = require("bookshelf")(knex); // require Bookshelf ORM Framework

// DEFINE MODELS
const Models = require("./bookshelfModels.js")(Bookshelf);

exports.handler = async () => {
  let success = false;
  try {
    console.log("STARTING CLUB DEBT SERVICE 🚀💵");

    let registrations = await Models.Registrations.forge().fetch();
    registrations = registrations.toJSON();
    const totalClubDebt = registrations.reduce(
      (sum, { price_owed, price_paid }) => sum + price_owed - price_paid,
      0
    );
    const result = await Models.Club_Debt.forge({
      debt: totalClubDebt,
      timestamp: new Date()
    }).save();
    if (result.toJSON().debt === totalClubDebt) {
      console.log("Successfully saved total club debt 🎉");
      success = true;
    }
    return success;
  } catch (err) {
    console.error(err.message);
    return false;
  }
};
