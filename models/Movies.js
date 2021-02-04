module.exports = (sequelize, DataTypes) => {
	return sequelize.define('movies', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		genre_id: DataTypes.INTEGER,
		platform: DataTypes.STRING,
		username: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};