const finApiService = require("./finApiService");
const processTransactions = require("./processTransactions");
const transactionIdModelHelpers = require("./transactionIdModelHelpers");

async function execute() {
  console.log("💵💵💵 Starting bank service 💵💵💵");
  const newTransactions = await finApiService.getNewTransactions();
  if (!newTransactions || !newTransactions.length) return;

  await transactionIdModelHelpers.saveTransactionIds(newTransactions);
  await processTransactions.processTransactions(newTransactions);
}

exports.handler = execute;
