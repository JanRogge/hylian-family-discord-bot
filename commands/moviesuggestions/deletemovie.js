const { Movie } = require('../../dbObjects');

module.exports = {
	name: 'deletemovie',
	description: 'Delete Movie!',
	category: 'moviesuggestions',
	aliases: ['delete'],
	args: true,
	execute: async function(message, args) {
		const movieName = args.join(' ');

		const rowCount = await Movie.destroy({ where: { name: movieName } });
		if (!rowCount) return message.reply('That movie did not exist.');

		return message.reply('Movie deleted.');
	},
};