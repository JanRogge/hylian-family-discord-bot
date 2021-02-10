const { VoiceRoleLink } = require('../../dbObjects');

module.exports = {
	name: 'addvoicelink',
	description: 'Add a voice link!',
	category: 'voicelink',
	aliases: ['vradd'],
	permissions: 'ADMINISTRATOR',
	args: true,
	execute: async function(message) {

		if (!message.member.voice.channelID) return message.reply('Du musst für diesen Befehl in gewünschten Voice Channel sein!');

		const voiceLinks = await VoiceRoleLink.findOne({ where: { guild_id: message.guild.id, voice_channel_id: message.member.voice.channelID } });

		if (voiceLinks) {
			const roleString = voiceLinks.role_ids + `,${message.mentions.roles.first().id}`;

			const affectedRows = await VoiceRoleLink.update({ role_ids: roleString }, { where: { guild_id: message.guild.id, voice_channel_id: message.member.voice.channelID } });
			if (affectedRows > 0) {
				return message.reply(`Voicelink for channel ${message.member.voice.channelID} was edited. Roles are now ${roleString}.`);
			}
			return message.reply('Error while trying to update voicelink!');
		}

		try {
			const voicerolelink = await VoiceRoleLink.create({
				guild_id: message.guild.id,
				voice_channel_id: message.member.voice.channelID,
				role_ids: message.mentions.roles.first().id,
			});
			return message.reply(`Voicelink was added to channel ${voicerolelink.voice_channel_id} with the role ${message.mentions.roles.first().id}`);
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return message.reply('There is already a voicelink for this channel!');
			}
			return message.reply('There was an error trying to add the voicelink!');
		}
	},
};