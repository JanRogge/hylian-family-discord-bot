const { Settings, Movie, Genre } = require('../dbObjects');

module.exports = async (client, guild) => {
	await Settings.destroy({ where: { guild_id: guild.id } });
	await Movie.destroy({ where: { guild_id: guild.id } });
	await Genre.destroy({ where: { guild_id: guild.id } });
};