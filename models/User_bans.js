module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_ban', {
		guild_id: {
			type: DataTypes.STRING,
			unique: 'blacklistComposite',
		},
		user_id: {
			type: DataTypes.STRING,
			unique: 'blacklistComposite',
		},
		moderator_id: DataTypes.STRING,
		reason: DataTypes.TEXT,
		type: DataTypes.STRING,
		alt_ids: DataTypes.TEXT,
	});
};