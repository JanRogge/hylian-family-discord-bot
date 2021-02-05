const { Movie, Genre } = require('../../dbObjects');

module.exports = {
	name: 'addmovie',
	description: 'Add Movie!',
	category: 'moviesuggestions',
	usage: '<name> <genre> <platform>',
	aliases: ['add'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	args: true,
	guildOnly: true,
	execute: async function(message, args) {

		const movieName = args.slice(0, -3).join(' ');
		const movieGenreName = args.slice(-3, -2).toString();
		const movieGenre = await Genre.findOne({ where: { name: movieGenreName, guild_id: message.guild.id } });
		const moviePlatform = args.slice(-2, -1).toString();
		const movieTrailer = args.slice(-1).toString();

		if (!movieGenre) {
			return message.reply(`${movieGenreName} ist kein verfügbares Genre.`);
		}

		try {
			const movie = await Movie.create({
				name: movieName,
				genre_id: movieGenre.id,
				platform: moviePlatform,
				trailer: movieTrailer,
				user_id: message.author.id,
				guild_id: message.guild.id,

			});
			return message.reply(`Film ${movie.name} wurde hinzugefügt.`);
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return message.reply('Der Filme existiert bereits.');
			}
			return message.reply('Es gab beim hinzufügen einen Fehler.');
		}
	},
};