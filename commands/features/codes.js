const { SlashCommandBuilder } = require('discord.js');
const { Settings } = require('../../dbObjects');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('codes')
		.setDescription('Changes the channel where you post invite codes and the role to which they should be relayed!')
        .addChannelOption(option => option.setName('channel').setDescription('Name of the Code Channel').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('Name of the Live Role').setRequired(true))
        .setDefaultPermission(false),
	async execute(interaction) {
		const codeChannel = interaction.options.getChannel('channel');
		const liveRole = interaction.options.getRole('role');

		const affectedRows = await Settings.update({ code_channel_id: codeChannel.id, live_role_id: liveRole.id }, { where: { guild_id: interaction.guild.id } });
		if (affectedRows > 0) {
			return await interaction.reply({ content: `The codes channel is now ${codeChannel} and the live role ist now ${liveRole}`, ephemeral: true });
		}
	},
    async disable(interaction) {
        await Settings.update({ code_channel_id: null, live_role_id: null }, { where: { guild_id: interaction.guild.id } });
    },
    async enable() {
        return;
    },
};