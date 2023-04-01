const { SlashCommandBuilder } = require('discord.js');
const { VoiceRoleLink } = require('../dbObjects');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('voicelink')
		.setDescription('Create or edit a voicelink between a voicechannel and a role.')
		.addSubcommand(subcommmand =>
			subcommmand.setName('add')
				.setDescription('Add a voicelink between and a role and a voice channel.')
				.addRoleOption(option => option.setName('role').setDescription('Name of the role that should be added when joining the voice channel.').setRequired(true)),

		)
		.addSubcommand(subcommmand =>
			subcommmand.setName('delete')
				.setDescription('Remove a voicelink between and a role and a voice channel.')
				.addRoleOption(option => option.setName('role').setDescription('Name of the role that should be removed when leaving the voice channel.').setRequired(true)),

		)
		.setDefaultPermission(false),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'add') {
			if (!interaction.member.voice.channelId) return await interaction.reply({ content: 'Du musst für diesen Befehl in gewünschten Voice Channel sein!', ephemeral: true });

			const channelId = interaction.member.voice.channelId;

			const voiceLinks = await VoiceRoleLink.findOne({ where: { guild_id: interaction.guild.id, voice_channel_id: channelId } });

			if (voiceLinks) {
				const roleString = voiceLinks.role_ids + `,${interaction.options.getRole('role').id}`;

				const affectedRows = await VoiceRoleLink.update({ role_ids: roleString }, { where: { guild_id: interaction.guild.id, voice_channel_id: channelId } });
				if (affectedRows > 0) {
					let mentionRoles = roleString.split(',');
					mentionRoles = mentionRoles.map(roleId => '<@&' + roleId + '>');
					return await interaction.reply({ content: `Voicelink for channel <#${channelId}> was edited. Roles are now ${mentionRoles}.`, ephemeral: true });
				}
				return await interaction.reply({ content: 'Error while trying to update voicelink!', ephemeral: true });
			}

			try {
				const voicerolelink = await VoiceRoleLink.create({
					guild_id: interaction.guild.id,
					voice_channel_id: channelId,
					role_ids: interaction.options.getRole('role').id,
				});
				return await interaction.reply({ content: `Voicelink was added to channel <#${voicerolelink.voice_channel_id}> with the role <@&${interaction.options.getRole('role').id}>`, ephemeral: true });
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					return await interaction.reply({ content: 'There is already a voicelink for this channel!', ephemeral: true });
				}
				return await interaction.reply({ content: 'There was an error trying to add the voicelink!', ephemeral: true });
			}
		}
		else if (interaction.options.getSubcommand() === 'delete') {
			if (!interaction.member.voice.channelId) return await interaction.reply({ content: 'Du musst für diesen Befehl in gewünschten Voice Channel sein!', ephemeral: true });

			const channelId = interaction.member.voice.channelId;

			const voiceLinks = await VoiceRoleLink.findOne({ where: { guild_id: interaction.guild.id, voice_channel_id: channelId } });

			if (voiceLinks) {
				const roleArray = voiceLinks.role_ids.split(',');

				if (roleArray.length === 1) {
					const rowCount = await VoiceRoleLink.destroy({ where: { guild_id: interaction.guild.id, voice_channel_id: channelId } });
					if (!rowCount) return await interaction.reply({ content: 'There is now Voicelink for the current channel!', ephemeral: true });
					return await interaction.reply({ content: `Voicelink for channel <#${channelId}> was deleted.`, ephemeral: true });
				}

				const roleString = roleArray.filter(roleID => roleID !== interaction.options.getRole('role').id).join();

				const affectedRows = await VoiceRoleLink.update({ role_ids: roleString }, { where: { guild_id: interaction.guild.id, voice_channel_id: channelId } });
				if (affectedRows > 0) {
					let mentionRoles = roleString.split(',');
					mentionRoles = mentionRoles.map(roleId => '<@&' + roleId + '>');
					return await interaction.reply({ content: `Voicelink for channel <#${channelId}> was edited. Roles are now ${mentionRoles}.`, ephemeral: true });
				}
				return await interaction.reply({ content: 'Error while trying to update voicelink!', ephemeral: true });
			}
		}
	},
	async disable(interaction) {
		await VoiceRoleLink.destroy({ where: { guild_id: interaction.guild.id } });
	},
	async enable() {
		return;
	},
};