const { Genre } = require('../../dbObjects');

module.exports = {
	name: 'addgenre',
	description: 'Adds a movie gerne!',
	category: 'moviesuggestions',
	aliases: ['addg'],
	args: true,
	execute: async function(message, args) {

		const genreName = args[0];
		const genreColor = args[1];

		try {
			const movie = await Genre.create({
				name: genreName,
				color: genreColor,
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