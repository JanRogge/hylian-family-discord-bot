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

module.exports = { Settings, VoiceRoleLink, Bits, Gifts, Messages, Rewards, TwitchAuth };