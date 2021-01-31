module.exports = (sequelize, DataTypes) => {
	return sequelize.define('gerne', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		color: {
			type: DataTypes.STRING,
			unique: true,
		},
	});
};