module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_ban', {
		discordId: {
			type: DataTypes.STRING,
			unique: true,
		},
		moderator: DataTypes.STRING,
		reason: DataTypes.TEXT,
		type: DataTypes.STRING,
		alts: DataTypes.TEXT,
	});
};