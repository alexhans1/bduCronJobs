const knex = require("knex")({
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
}); // require knex query binder
const Bookshelf = require("bookshelf")(knex); // require Bookshelf ORM Framework

// DEFINE MODELS
const Models = require("./bookshelfModels.js")(Bookshelf);

module.exports = {
  saveTransactionIds(transactions) {
    // Step 1:
    // extract Transaction Ids
    const transactionIds = transactions.map(transaction => ({
      transaction_id: transaction.id
    }));

    // Step 2:
    // save transactionIds into db
    try {
      const model = Models.Transaction_Ids_Col.forge(transactionIds);
      model.invokeThen("save");
    } catch (err) {
      console.error(err.message);
    }
  },

  async removeProcessedTransactions(transactions) {
    // Step 1:
    // get all existing transaction ids
    const response = await Models.Transaction_Ids.fetchAll();
    const existingTransactionIds = response
      .toJSON()
      .map(({ transaction_id }) => transaction_id);

    // Step 2:
    // filter out transactions that have previously been processed
    return transactions.filter(
      ({ id }) => !existingTransactionIds.includes(id.toString())
    );
  }
};
