const { Movie } = require('../../dbObjects');

module.exports = {
	name: 'delete',
	description: 'Delete Movie!',
	args: true,
	execute: async function(message, args) {
		const movieName = args[0];

		const rowCount = await Movie.destroy({ where: { name: movieName } });
		if (!rowCount) return message.reply('That movie did not exist.');

		return message.reply('Movie deleted.');
	},
};