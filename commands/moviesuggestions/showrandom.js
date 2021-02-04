const Discord = require('discord.js');
const { Movie } = require('../../dbObjects');

module.exports = {
	name: 'showrandom',
	description: 'Show random Movie!',
	category: 'moviesuggestions',
	aliases: ['random'],
	args: false,
	execute: async function(message) {
		const movieList = await Movie.findAll({
			include: ['genre'],
		});
		const movie = movieList[Math.floor(Math.random() * movieList.length)] || 'Es gibt keine Filme.';
		const embed = new Discord.MessageEmbed()
			// Set the title of the field
			.setTitle('Film Vorschlag')
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