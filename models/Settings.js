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
		code_channel_id: DataTypes.STRING,
		live_role_id: DataTypes.STRING,
		code_blacklist_roles_id: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};