const { Genre } = require('../../dbObjects');

module.exports = {
	name: 'editgenre',
	description: 'Edit Genre!',
	category: 'moviesuggestions',
	aliases: ['editg'],
	args: true,
	execute: async function(message, args) {
		const genreName = args[0];
		const genreColor = args[0];

		// equivalent to: UPDATE tags (descrption) values (?) WHERE name = ?;
		const affectedRows = await Genre.update({ color: genreColor}, { where: { name: genreName } });
		if (affectedRows > 0) {
			return message.reply(`Genre ${genreName} was edited.`);
		}
		return message.reply(`Could not find a movie with name ${genreName}.`);
	},
};