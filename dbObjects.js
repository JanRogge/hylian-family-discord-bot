require('dotenv').config();
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
	//dialectOptions: {
	//	ssl: {
	//		rejectUnauthorized: false,
	//	},
	//},
});

const Settings = require('./models/Settings')(sequelize, Sequelize.DataTypes);
const VoiceRoleLink = require('./models/VoiceRoleLink')(sequelize, Sequelize.DataTypes);


module.exports = { Settings, VoiceRoleLink };