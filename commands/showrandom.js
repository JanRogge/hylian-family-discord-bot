const Discord = require('discord.js');
const { Movie } = require('../dbObjects');

module.exports = {
	name: 'random',
	description: 'Show random Movie!',
	args: false,
	execute: async function(message) {
		const movieList = await Movie.findAll();
		const movieString = movieList[Math.floor(Math.random() * movieList.length)] || 'Es gibt keine Filme.';
		const embed = new Discord.MessageEmbed()
		// Set the title of the field
			.setTitle('Film Vorschlag')
		// Set the color of the embed
			.setColor(Math.floor(Math.random() * 16777215).toString(16))
			.addFields(
				{ name: 'Title', value: movieString.name, inline: true },
				{ name: 'Plattform', value: movieString.plattform, inline: true },
				{ name: 'Gerne', value: movieString.gerne, inline: true },
				{ name: 'Vorschlag von', value: movieString.username },
			);
		// Send the embed to the same channel as the message
		return message.channel.send(embed);
	},
};