module.exports = (sequelize, DataTypes) => {
	return sequelize.define('genre', {
		guild_id: {
			type: DataTypes.STRING,
			unique: 'genreComposite',
		},
		name: {
			type: DataTypes.STRING,
			unique: 'genreComposite',
		},
		color: {
			type: DataTypes.STRING,
			unique: 'genreComposite',
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};