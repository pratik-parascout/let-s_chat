const Sequelize = require('sequelize');

const sequelize = new Sequelize('lets_talk', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
