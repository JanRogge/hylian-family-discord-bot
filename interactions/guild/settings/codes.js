const { Settings } = require('../../../dbObjects');

module.exports = {
	name: 'codes',
	description: 'Changes the channel where you post invite codes and the role to which they should be relayed!',
	options: [
		{
			name: 'channel',
			type: 'CHANNEL',
			description: 'Name of the Code Channel',
			required: true,
		}, {
			name: 'role',
			type: 'ROLE',
			description: 'Name of the live role',
			required: true,
		},
	],
	defaultPermission: false,
	// Only Admins
	permissions: [
		{
			id: '139415003680735233',
			type: 'USER',
			permission: true,
		},
	],
	disable: async function(interaction) {
		await Settings.update({ code_channel_id: null, live_role_id: null }, { where: { guild_id: interaction.guild.id } });
	},
	enable: async function() {
		return;
	},
	execute: async function(interaction) {
		const codeChannel = interaction.options.get('channel').channel;
		const liveRole = interaction.options.get('role').role;

		const affectedRows = await Settings.update({ code_channel_id: codeChannel.id, live_role_id: liveRole.id }, { where: { guild_id: interaction.guild.id } });
		if (affectedRows > 0) {
			return await interaction.reply(`The codes channel is now ${codeChannel} and the live role ist now ${liveRole}`, { ephemeral: true });
		}
	},

};