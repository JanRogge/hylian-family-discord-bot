module.exports = (sequelize, DataTypes) => {
	return sequelize.define('twitch_auth', {
		access_token: {
			type: DataTypes.STRING,
			unique: true,
		},
		refresh_token: {
			type: DataTypes.STRING,
			unique: true,
		},
		expires_in: DataTypes.INTEGER,
		obtainment_timestamp: DataTypes.INTEGER,
		scope: DataTypes.ARRAY(DataTypes.STRING),
		user_id: {
			type: DataTypes.STRING,
			unique: true,
		},
	}, {
		timestamps: false,
	});
};