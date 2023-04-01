require('dotenv').config();
const Sequelize = require('sequelize');

let sequelize;
if (process.env.NODE_ENV === 'development') {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		logging: false,
	});
}
else {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		logging: false,
		dialectOptions: {
			ssl: {
				rejectUnauthorized: false,
			},
		},
	});
}

const Settings = require('./models/Settings')(sequelize, Sequelize.DataTypes);
const VoiceRoleLink = require('./models/VoiceRoleLink')(sequelize, Sequelize.DataTypes);
const Bits = require('./models/Bits')(sequelize, Sequelize.DataTypes);
const Gifts = require('./models/Gifts')(sequelize, Sequelize.DataTypes);
const Messages = require('./models/Messages')(sequelize, Sequelize.DataTypes);
const Rewards = require('./models/Rewards')(sequelize, Sequelize.DataTypes);
const TwitchAuth = require('./models/TwitchAuth')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ force, alter }).then(async () => {
	const settings = [
		Settings.upsert({ guild_id: '599895341487226881', reward_channel_id: '791703686912016405', twitch_id: '31547053', cron_active:false }),
	];
	await Promise.all(settings);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);