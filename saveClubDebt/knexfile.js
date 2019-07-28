// Update with your config settings.

module.exports = {
  clearDB: {
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
  }
};
