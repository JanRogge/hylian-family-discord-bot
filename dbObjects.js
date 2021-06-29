const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	//dialectOptions: {
	//	ssl: {
	//		rejectUnauthorized: false,
	//	},
	//},
});

const Movie = require('./models/Movies')(sequelize, Sequelize.DataTypes);
const Genre = require('./models/Genre')(sequelize, Sequelize.DataTypes);
const User_bans = require('./models/User_bans')(sequelize, Sequelize.DataTypes);
const Settings = require('./models/Settings')(sequelize, Sequelize.DataTypes);
const VoiceRoleLink = require('./models/VoiceRoleLink')(sequelize, Sequelize.DataTypes);

Movie.belongsTo(Genre, { foreignKey: 'genre_id', as: 'genre' });


module.exports = { Movie, Genre, User_bans, Settings, VoiceRoleLink };