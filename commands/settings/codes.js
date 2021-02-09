const { Settings } = require('../../dbObjects');

module.exports = {
	name: 'codes',
	description: 'Changes the channel where you post invite codes and the role to which they should be relayed!',
	category: 'settings',
	permissions: 'ADMINISTRATOR',
	args: false,
	execute: async function(message, args) {
		if (message.guild) {
			if (args.length) {
				const codeChannel = message.mentions.channels.first();
				const liveRole = message.mentions.roles.first();

				const affectedRows = await Settings.update({ code_channel_id: codeChannel.id, live_role_id: liveRole.id }, { where: { guild_id: message.guild.id } });
				if (affectedRows > 0) {
					return message.reply(`The codes channel is now ${codeChannel} and the live role ist now ${liveRole}`);
				}
			}
		}
	},

};