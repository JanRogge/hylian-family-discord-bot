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
			where: { guild_id: message.guild.id },
			include: ['genre'],
		});
		const movieCollection = new Discord.Collection();
		movieList.forEach(movie => {
			movieCollection.set(movie.id, movie);
		});
		const movie = movieCollection.random();
		const user = await message.client.users.fetch(movie.user_id);
		if (!movie) return message.channel.send('Es gibt keine Filme.');
		const embed = new Discord.MessageEmbed()
			.setTitle('Filmvorschlag')
			.setColor(movie.genre.color)
			.addFields(
				{ name: 'Title', value: movie.name, inline: true },
				{ name: 'Genre', value: movie.genre.name, inline: true },
				{ name: 'Platform', value: movie.platform, inline: true },
				{ name: 'Trailer', value: movie.trailer },
				{ name: 'Vorschlag von', value:  user },
			);
		return message.channel.send(embed);
	},
};