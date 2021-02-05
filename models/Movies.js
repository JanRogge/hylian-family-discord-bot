module.exports = (sequelize, DataTypes) => {
	return sequelize.define('movies', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		genre_id: DataTypes.INTEGER,
		platform: DataTypes.STRING,
		user_id: DataTypes.STRING,
		trailer: DataTypes.STRING,
		guild_id: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};