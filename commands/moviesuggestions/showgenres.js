const { Genre } = require('../../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'showgenres',
	description: 'Show all genres!',
	category: 'moviesuggestions',
	aliases: ['genres'],
	channelWhitelist: ['789139711829737522', '791703686912016405'],
	roles: ['766633420713230336', '599906769589764097'],
	execute: async function(message) {

		const genres = await Genre.findAll({ where: { guild_id: message.guild.id } });

		if (!genres.length) return message.channel.send('Es gibt keine Genres.');

		let genreField = '';

		genres.forEach(child => {
			genreField = genreField + child.name + '\n';
		});

		const embed = new Discord.MessageEmbed()
			.setTitle('Genres')
			.setColor('YELLOW')
			.addFields(
				{ name: 'Name', value: genreField, inline: true },
			);
		return message.channel.send(embed);
	},
};