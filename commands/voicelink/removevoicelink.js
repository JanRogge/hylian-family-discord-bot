const { VoiceRoleLink } = require('../../dbObjects');

module.exports = {
	name: 'removevoicelink',
	description: 'Add a voice link!',
	category: 'voicelink',
	aliases: ['vrremove'],
	permissions: 'ADMINISTRATOR',
	args: true,
	execute: async function(message) {

		if (!message.member.voice.channelID) return message.reply('Du musst für diesen Befehl in gewünschten Voice Channel sein!');

		const voiceLinks = await VoiceRoleLink.findOne({ where: { guild_id: message.guild.id, voice_channel_id: message.member.voice.channelID } });

		if (voiceLinks) {
			const roleArray = voiceLinks.role_ids.split(',');

			if (roleArray.length === 1) {
				const rowCount = await VoiceRoleLink.destroy({ where: { guild_id: message.guild.id, voice_channel_id: message.member.voice.channelID } });
				if (!rowCount) return message.reply('That movie did not exist.');
				return message.reply('Movie deleted.');
			}

			const roleString = roleArray.filter(roleID => roleID !== message.mentions.roles.first().id).join();

			const affectedRows = await VoiceRoleLink.update({ role_ids: roleString }, { where: { guild_id: message.guild.id, voice_channel_id: message.member.voice.channelID } });
			if (affectedRows > 0) {
				return message.reply(`Genre ${message.member.voice.channelID} was edited.`);
			}
			return message.reply('Fehler beim updaten');
		}
	},
};