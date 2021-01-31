module.exports = (sequelize, DataTypes) => {
	return sequelize.define('movies', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		gerne: DataTypes.STRING,
		plattform: DataTypes.STRING,
		username: DataTypes.STRING,
	});
};