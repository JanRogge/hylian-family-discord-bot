const { Genre } = require('../../dbObjects');

module.exports = {
	name: 'deletegenre',
	description: 'Delete Genre!',
	category: 'moviesuggestions',
	aliases: ['deleteg'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	args: true,
	execute: async function(message, args) {
		const genreName = args[0];

		const rowCount = await Genre.destroy({ where: { name: genreName, guild_id: message.guild.id } });
		if (!rowCount) return message.reply('That genre did not exist.');

		return message.reply('Genre deleted.');
	},
};