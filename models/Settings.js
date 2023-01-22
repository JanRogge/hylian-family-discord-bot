module.exports = (sequelize, DataTypes) => {
	return sequelize.define('config', {
		config_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		guild_id: {
			type: DataTypes.STRING,
			unique: true,
		},
		reward_channel_id: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};