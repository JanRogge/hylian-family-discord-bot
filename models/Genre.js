module.exports = (sequelize, DataTypes) => {
	return sequelize.define('genre', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		color: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};