const Sequelize = require('sequelize');

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

/* const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
}); */

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
});

const Movie = require('./models/Movies')(sequelize, Sequelize.DataTypes);
const Genre = require('./models/Genre')(sequelize, Sequelize.DataTypes);
const User_bans = require('./models/User_bans')(sequelize, Sequelize.DataTypes);
const Settings = require('./models/Settings')(sequelize, Sequelize.DataTypes);

Movie.belongsTo(Genre, { foreignKey: 'genre_id', as: 'genre' });


module.exports = { Movie, Genre, User_bans, Settings };