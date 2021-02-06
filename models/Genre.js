module.exports = (sequelize, DataTypes) => {
	return sequelize.define('genre', {
		name: {
			type: DataTypes.STRING,
			unique: 'genreComposite',
		},
		color: {
			type: DataTypes.STRING,
			unique: 'genreComposite',
			allowNull: false,
		},
		guild_id: {
			type: DataTypes.STRING,
			unique: 'genreComposite',
		},
	}, {
		timestamps: false,
	});
};