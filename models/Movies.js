module.exports = (sequelize, DataTypes) => {
	return sequelize.define('movies', {
		guild_id: {
			type: DataTypes.STRING,
			unique: 'movieComposite',
		},
		name: {
			type: DataTypes.STRING,
			unique: 'movieComposite',
		},
		genre_id: DataTypes.INTEGER,
		platform: DataTypes.STRING,
		user_id: DataTypes.STRING,
		trailer: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};