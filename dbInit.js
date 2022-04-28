require('dotenv').config();
const Sequelize = require('sequelize');

console.log(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
});

const Settings = require('./models/Settings')(sequelize, Sequelize.DataTypes);
const VoiceRoleLink = require('./models/VoiceRoleLink')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ force, alter }).then(async () => {
	const settings = [
		Settings.upsert({ guild_id: '599895341487226881'}),
	];
	await Promise.all(settings);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);