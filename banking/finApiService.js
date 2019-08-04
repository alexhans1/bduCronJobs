// enables environment variables for development
const moment = require("moment");
const request = require("request-promise");

const transactionIdModelHelpers = require("./transactionIdModelHelpers");

const baseURL = process.env.finAPIBaseURL;
const CLIENT_ID = process.env.finApiClientID;
const CLIENT_SECRET = process.env.finApiClientSecret;

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++ CONNECTING TO BANK TO GET TRANSACTIONS ++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const authenticateClient = async () => {
  const options = {
    method: "post",
    url: `${baseURL}/oauth/token`,
    qs: {
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    },
    json: true
  };

  try {
    const parsedBody = await request(options);
    if (parsedBody.access_token) {
      return parsedBody.access_token;
    } else console.error("No client token!");
  } catch (err) {
    console.error("$$$ Error while getting client token.");
    console.error(err.message);
  }
};

const authenticateUser = async clientToken => {
  const options = {
    method: "POST",
    url: `${baseURL}/oauth/token`,
    qs: {
      grant_type: "password",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: process.env.finApiUsername,
      password: process.env.finApiUserPassword
    },
    headers: {
      Authorization: `Bearer ${clientToken}`
    },
    json: true
  };

  try {
    const parsedBody = await request(options);
    if (parsedBody.access_token) {
      return parsedBody.access_token;
    } else return console.error("No user token!");
  } catch (err) {
    console.error("$$$ Error while authenticating user.");
    console.error(err.message);
  }
};

const updateBankConnection = async userToken => {
  const options = {
    method: "POST",
    url: `${baseURL}/api/v1/bankConnections/update`,
    body: {
      bankConnectionId: process.env.finApiBankConnectionId
    },
    headers: {
      Authorization: `Bearer ${userToken}`
    },
    json: true
  };

  try {
    const parsedBody = await request(options);
    if (!parsedBody.errors) {
      return true;
    } else {
      console.error("$$$ Update bank connection failed.");
      return console.error(parsedBody.errors);
    }
  } catch (err) {
    console.error("$$$ Error while updating bank connection");
    return console.error(err.message);
  }
};

async function getAllTransactions(userToken) {
  const options = {
    method: "GET",
    url: `${baseURL}/api/v1/transactions`,
    qs: {
      view: "userView",
      direction: "income",
      includeChildCategories: true,
      perPage: 500,
      minBankBookingDate: moment()
        .subtract(1, "days")
        .format("YYYY-MM-DD")
    },
    headers: {
      Authorization: `Bearer ${userToken}`
    },
    json: true
  };

  try {
    const response = await request(options);
    if (response && response.transactions) {
      const newTransactions = await transactionIdModelHelpers.removeProcessedTransactions(
        response.transactions
      );
      return newTransactions;
    }
  } catch (ex) {
    console.error("$$$ Error while getting all transactions.");
    return console.error(ex.message);
  }
}

module.exports = {
  async getNewTransactions() {
    // get the access and user tokens
    const accessToken = await authenticateClient();
    if (!accessToken) return undefined;
    const userToken = await authenticateUser(accessToken);
    if (!userToken) return undefined;

    // update the bank connection
    const success = await updateBankConnection(userToken);
    if (!success) return undefined;
    // wait for more than enough time for the bank connection to be updated by finAPI
    await new Promise(resolve => setTimeout(resolve, 10000));

    // return the new transactions
    return getAllTransactions(userToken);
  }
};
