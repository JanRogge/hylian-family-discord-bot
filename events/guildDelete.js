const { Settings, Movie, Genre, VoiceRoleLink } = require('../dbObjects');

module.exports = async (client, guild) => {
	await Settings.destroy({ where: { guild_id: guild.id } });
	await Movie.destroy({ where: { guild_id: guild.id } });
	await Genre.destroy({ where: { guild_id: guild.id } });
	await VoiceRoleLink.destroy({ where: { guild_id: guild.id } });
	const commands = guild.commands.fetch();
	commands.forEach(async command => {
		guild.commands.delete(command.id);
	});
};