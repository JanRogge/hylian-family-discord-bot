const Sequelize = require('sequelize');

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Movie = require('./models/Movies')(sequelize, Sequelize.DataTypes);
const Gerne = require('./models/Gerne')(sequelize, Sequelize.DataTypes);


module.exports = { Movie, Gerne };