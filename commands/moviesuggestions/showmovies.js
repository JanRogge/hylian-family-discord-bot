const { Movie, Genre } = require('../../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'showmovies',
	description: 'Show all Movie!',
	category: 'moviesuggestions',
	aliases: ['show', 'showAll'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	usage: '<Genre> | empty',
	execute: async function(message, args) {

		let movieList = [];

		if (args.length) {
			const movieGenreName = args[0];
			const movieGenre = await Genre.findOne({ where: { name: movieGenreName } });

			movieList = await Movie.findAll({
				where: { genre_id: movieGenre.id },
				include: ['genre'],
			});
		}
		else {
			movieList = await Movie.findAll({
				include: ['genre'],
			});
		}

		if (!movieList) return message.channel.send('Es gibt keine Filme.');

		const sortBy = movieList.reduce((groups, item) => {
			const group = (groups[item.genre_id] || []);
			group.push(item);
			groups[item.genre_id] = group;
			return groups;
		}, {});

		Object.values(sortBy).forEach(element => {

			let titleField = '';
			let platformField = '';
			let genre = '';

			element.forEach(child => {
				genre = child.genre;
				titleField = titleField + child.name + '\n';
				platformField = platformField + child.platform + '\n';
			});

			const embed = new Discord.MessageEmbed()
				.setTitle(genre.name)
				.setColor(genre.color)
				.addFields(
					{ name: 'Title', value: titleField, inline: true },
					{ name: 'Platform', value: platformField, inline: true },
				);
			message.channel.send(embed);

		});

		return;
	},
};