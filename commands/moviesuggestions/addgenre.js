const { Genre } = require('../../dbObjects');

module.exports = {
	name: 'addgenre',
	description: 'Adds a movie gerne!',
	category: 'moviesuggestions',
	aliases: ['addg'],
	args: true,
	execute: async function(message, args) {

		const movieName = args[0];
		const movieColor = args[1];

		try {
			// equivalent to: INSERT INTO tags (name, descrption, username) values (?, ?, ?);
			const movie = await Genre.create({
				name: movieName,
				color: movieColor,
			});
			return message.reply(`Gerne ${movie.name} wurde hinzugefügt.`);
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return message.reply('Der Gerne oder Farbe exsisiert bereits.');
			}
			return message.reply('Es gabe beim hinzufügen einen Fehler.');
		}
	},
};