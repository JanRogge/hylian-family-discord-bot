module.exports = (sequelize, DataTypes) => {
	return sequelize.define('messages', {
		guild_id: DataTypes.STRING,
		channel_id: DataTypes.STRING,
		message_id: DataTypes.STRING,
		name: DataTypes.STRING,
		done: DataTypes.BOOLEAN,
	}, {
		timestamps: true,
	});
};