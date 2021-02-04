const { Movie, Genre } = require('../../dbObjects');

module.exports = {
	name: 'addmovie',
	description: 'Add Movie!',
	category: 'moviesuggestions',
	usage: '<name> <genre> <platform>',
	aliases: ['add'],
	channelWhitelist: [791703686912016405],
	args: true,
	execute: async function(message, args) {

		const movieName = args[0].substring(1, args[0].length - 1);
		const movieGenreName = args[1];
		const movieGenre = await Genre.findOne({ where: { name: movieGenreName } });
		const moviePlatform = args[2];

		if (!movieGenre) {
			return message.reply(`${movieGenreName} ist kein verfügbares Genre.`);
		}

		try {
			// equivalent to: INSERT INTO tags (name, descrption, username) values (?, ?, ?);
			const movie = await Movie.create({
				name: movieName,
				genre_id: movieGenre.id,
				platform: moviePlatform,
				username: message.author.username,
			});
			return message.reply(`Film ${movie.name} wurde hinzugefügt.`);
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return message.reply('Der Filme exsisiert bereits.');
			}
			return message.reply('Es gabe beim hinzufügen einen Fehler.');
		}
	},
};