// Database connection settings, used by both the models and sequelize-cli.
// SQLite keeps the whole database in one file (server/gym.sqlite), so nobody
// has to install or run a database server.
const path = require('path');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '..', 'gym.sqlite'),
    logging: false,
  },
};
