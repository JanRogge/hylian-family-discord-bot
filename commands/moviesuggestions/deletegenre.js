const { Genre } = require('../../dbObjects');

module.exports = {
	name: 'deletegenre',
	description: 'Delete Genre!',
	category: 'moviesuggestions',
	aliases: ['deleteg'],
	args: true,
	execute: async function(message, args) {
		const genreName = args[0];

		const rowCount = await Genre.destroy({ where: { name: genreName } });
		if (!rowCount) return message.reply('That genre did not exist.');

		return message.reply('Genre deleted.');
	},
};