module.exports = (sequelize, DataTypes) => {
	return sequelize.define('bits', {
		user_id: DataTypes.STRING,
		amount: DataTypes.INTEGER,
		broadcaster_id: DataTypes.STRING,
	}, {
		timestamps: true,
	});
};