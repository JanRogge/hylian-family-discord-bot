const Discord = require('discord.js');
const { Movie } = require('../../dbObjects');

module.exports = {
	name: 'showrandom',
	description: 'Show random Movie!',
	category: 'moviesuggestions',
	aliases: ['random'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	cooldown: 1,
	args: false,
	execute: async function(message) {
		const movieList = await Movie.findAll({
			include: ['genre'],
		});
		const movieCollection = new Discord.Collection();
		movieList.forEach(movie => {
			movieCollection.set(movie.id, movie);
		});
		const movie = movieCollection.random();
		if (!movie) return message.channel.send('Es gibt keine Filme.');
		const embed = new Discord.MessageEmbed()
			// Set the title of the field
			.setTitle('Filmvorschlag')
			// Set the color of the embed
			.setColor(movie.genre.color)
			.addFields(
				{ name: 'Title', value: movie.name, inline: true },
				{ name: 'Genre', value: movie.genre.name, inline: true },
				{ name: 'Platform', value: movie.platform, inline: true },
				{ name: 'Vorschlag von', value: movie.username },
			);
		// Send the embed to the same channel as the message
		return message.channel.send(embed);
	},
};