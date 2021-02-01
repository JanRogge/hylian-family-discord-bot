const { Movie } = require('../../dbObjects');

module.exports = {
	name: 'add',
	description: 'Add Movie!',
	args: true,
	execute: async function(message, args) {

		const movieName = args[0].substring(1, args[0].length - 1);
		const movieGerne = args[1];
		const moviePlattform = args[2];

		try {
			// equivalent to: INSERT INTO tags (name, descrption, username) values (?, ?, ?);
			const movie = await Movie.create({
				name: movieName,
				gerne: movieGerne,
				plattform: moviePlattform,
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