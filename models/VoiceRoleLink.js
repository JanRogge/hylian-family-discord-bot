module.exports = (sequelize, DataTypes) => {
	return sequelize.define('vcrolelink', {
		guild_id: {
			type: DataTypes.STRING,
			unique: 'vcRoleComposite',
		},
		voice_channel_id: {
			type: DataTypes.STRING,
			unique: 'vcRoleComposite',
		},
		role_ids: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};