const { Settings, VoiceRoleLink } = require('../dbObjects');

module.exports = {
	name: 'guildDelete',
	async execute(guild) {
		await Settings.destroy({ where: { guild_id: guild.id } });
		await VoiceRoleLink.destroy({ where: { guild_id: guild.id } });
	}
};