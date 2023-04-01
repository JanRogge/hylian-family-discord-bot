module.exports = (sequelize, DataTypes) => {
	return sequelize.define('rewards', {
		user_id: DataTypes.STRING,
		broadcaster_id: DataTypes.STRING,
		won: DataTypes.BOOLEAN,
	}, {
		timestamps: true,
	});
};