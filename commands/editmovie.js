const { Movie } = require('../dbObjects');

module.exports = {
	name: 'edit',
	description: 'Edit Movie!',
	args: true,
	execute: async function(message, args) {
		const movieName = args[0];
		const movieGerne = args[1];

		// equivalent to: UPDATE tags (descrption) values (?) WHERE name = ?;
		const affectedRows = await Movie.update({ gerne: movieGerne }, { where: { name: movieName } });
		if (affectedRows > 0) {
			return message.reply(`Movie ${movieName} was edited.`);
		}
		return message.reply(`Could not find a movie with name ${movieName}.`);
	},
};