exports.dbConnection = {
  client: "mysql",
  connection: {
    host: "us-cdbr-iron-east-03.cleardb.net",
    user: "bb41eedfd379a8",
    password: process.env.clearDB_password,
    database: "heroku_9b6f95eb7a9adf8",
    charset: "utf8"
  },
  pool: {
    max: 10,
    min: 0
  },
  migrations: {
    tableName: "knex_migrations"
  }
};

const finApiService = require("./finApiService");
const processTransactions = require("./processTransactions");
const transactionIdModelHelpers = require("./transactionIdModelHelpers");

async function execute() {
  console.log("💵💵💵 Starting bank service 💵💵💵");
  const newTransactions = await finApiService.getNewTransactions();
  if (!newTransactions || !newTransactions.length)
    return console.info("No new transaction to process");

  await transactionIdModelHelpers.saveTransactionIds(newTransactions);
  await processTransactions.processTransactions(newTransactions);
}

exports.handler = execute;
