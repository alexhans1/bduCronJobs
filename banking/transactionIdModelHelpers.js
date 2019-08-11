const { dbConnection } = require("./index");
const knex = require("knex")(dbConnection); // require knex query binder
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
