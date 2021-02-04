const { Movie, Genre } = require('../../dbObjects');

module.exports = {
	name: 'editmovie',
	description: 'Edit Movie genre!',
	category: 'moviesuggestions',
	aliases: ['edit'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	args: true,
	execute: async function(message, args) {
		const movieName = args.slice(0, -1).join(' ');
		const movieGenreName = args.slice(-1);
		const movieGenre = await Genre.findOne({ where: { name: movieGenreName } });

		if (!movieGenre) {
			return message.reply(`${movieGenreName} ist kein verfügbares Genre.`);
		}

		// equivalent to: UPDATE tags (descrption) values (?) WHERE name = ?;
		const affectedRows = await Movie.update({ genre_id: movieGenre.id }, { where: { name: movieName } });
		if (affectedRows > 0) {
			return message.reply(`Movie ${movieName} was edited.`);
		}
		return message.reply(`Could not find a movie with name ${movieName}.`);
	},
};