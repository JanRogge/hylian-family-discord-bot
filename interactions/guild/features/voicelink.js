const { VoiceRoleLink } = require('../../../dbObjects');

module.exports = {
	name: 'voicelink',
	description: 'Create or edit a voicelink between a voicechannel and a role.',
	options: [
		{
			name: 'add',
			type: 'SUB_COMMAND',
			description: 'Add a voicelink between and a role and a voice channel.',
			options: [
				{
					name: 'role',
					type: 'ROLE',
					description: 'Name of the role that should be added when joining the voice channel.',
					required: true,
				},
			],
		}, {
			name: 'delete',
			type: 'SUB_COMMAND',
			description: 'Remove a voicelink between and a role and a voice channel.',
			options: [
				{
					name: 'role',
					type: 'ROLE',
					description: 'Name of the role that should be removed when leaving the voice channel.',
					required: true,
				},
			],
		},
	],
	defaultPermission: true,
	// Only Admins
	permissions: [
		{
			id: '139415003680735233',
			type: 'USER',
			permissions: true,
		},
	],
	execute: async function(interaction) {
		if (interaction.options[0].name === 'add') {
			if (!interaction.member.voice.channelID) return await interaction.reply('Du musst für diesen Befehl in gewünschten Voice Channel sein!', { ephemeral: true });

			const voiceLinks = await VoiceRoleLink.findOne({ where: { guild_id: interaction.guild.id, voice_channel_id: interaction.member.voice.channelID } });

			if (voiceLinks) {
				const roleString = voiceLinks.role_ids + `,${interaction.options[0].options[0].value}`;

				const affectedRows = await VoiceRoleLink.update({ role_ids: roleString }, { where: { guild_id: interaction.guild.id, voice_channel_id: interaction.member.voice.channelID } });
				if (affectedRows > 0) {
					let mentionRoles = roleString.split(',');
					mentionRoles = mentionRoles.map(roleId => '<@&' + roleId + '>');
					return await interaction.reply(`Voicelink for channel <#${interaction.member.voice.channelID}> was edited. Roles are now ${mentionRoles}.`, { ephemeral: true });
				}
				return await interaction.reply('Error while trying to update voicelink!', { ephemeral: true });
			}

			try {
				const voicerolelink = await VoiceRoleLink.create({
					guild_id: interaction.guild.id,
					voice_channel_id: interaction.member.voice.channelID,
					role_ids: interaction.options[0].options[0].value,
				});
				return await interaction.reply(`Voicelink was added to channel <#${voicerolelink.voice_channel_id}> with the role <@&${interaction.mentions.roles.first().id}>`, { ephemeral: true });
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					return await interaction.reply('There is already a voicelink for this channel!', { ephemeral: true });
				}
				return await interaction.reply('There was an error trying to add the voicelink!', { ephemeral: true });
			}
		}
		else if (interaction.options[0].name === 'delete') {
			if (!interaction.member.voice.channelID) return await interaction.reply('Du musst für diesen Befehl in gewünschten Voice Channel sein!', { ephemeral: true });

			const voiceLinks = await VoiceRoleLink.findOne({ where: { guild_id: interaction.guild.id, voice_channel_id: interaction.member.voice.channelID } });

			if (voiceLinks) {
				const roleArray = voiceLinks.role_ids.split(',');

				if (roleArray.length === 1) {
					const rowCount = await VoiceRoleLink.destroy({ where: { guild_id: interaction.guild.id, voice_channel_id: interaction.member.voice.channelID } });
					if (!rowCount) return await interaction.reply('There is now Voicelink for the current channel!', { ephemeral: true });
					return await interaction.reply(`Voicelink for channel <#${interaction.member.voice.channelID}> was deleted.`, { ephemeral: true });
				}

				const roleString = roleArray.filter(roleID => roleID !== interaction.options[0].options[0].value).join();

				const affectedRows = await VoiceRoleLink.update({ role_ids: roleString }, { where: { guild_id: interaction.guild.id, voice_channel_id: interaction.member.voice.channelID } });
				if (affectedRows > 0) {
					let mentionRoles = roleString.split(',');
					mentionRoles = mentionRoles.map(roleId => '<@&' + roleId + '>');
					return await interaction.reply(`Voicelink for channel <#${interaction.member.voice.channelID}> was edited. Roles are now ${mentionRoles}.`, { ephemeral: true });
				}
				return await interaction.reply('Error while trying to update voicelink!', { ephemeral: true });
			}
		}
	},

};