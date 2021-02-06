const { Movie } = require('../../dbObjects');

module.exports = {
	name: 'deletemovie',
	description: 'Delete Movie!',
	category: 'moviesuggestions',
	usage: '<name>',
	aliases: ['delete'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	args: true,
	execute: async function(message, args) {
		const movieName = args.join(' ');

		const rowCount = await Movie.destroy({ where: { name: movieName, guild_id: message.guild.id } });
		if (!rowCount) return message.reply('That movie did not exist.');

		return message.reply('Movie deleted.');
	},
};