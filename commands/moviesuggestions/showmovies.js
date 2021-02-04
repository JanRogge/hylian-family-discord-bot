const { Movie } = require('../../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'showmovies',
	description: 'Show all Movie!',
	category: 'moviesuggestions',
	aliases: ['show', 'showAll'],
	args: false,
	execute: async function(message) {
		const movieList = await Movie.findAll();

		if (!movieList) return message.channel.send('Es gibt keine Filme.');

		const sortby = movieList.reduce((groups, item) => {
			const group = (groups[item.gerne] || []);
			group.push(item);
			groups[item.gerne] = group;
			return groups;
		}, {});

		Object.values(sortby).forEach(element => {

			let titlefield = '';
			let plattformfield = '';
			let gernefield = '';

			element.forEach(child => {
				gernefield = child.gerne;
				titlefield = titlefield + child.name + '\n';
				plattformfield = plattformfield + child.plattform + '\n';
			});

			console.log(element);

			const embed = new Discord.MessageEmbed()
				.setTitle(gernefield)
				.setColor(Math.floor(Math.random() * 16777215).toString(16))
				.addFields(
					{ name: 'Title', value: titlefield, inline: true },
					{ name: 'Plattform', value: plattformfield, inline: true },
				);
			message.channel.send(embed);

		});

		return;
	},
};