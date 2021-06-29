const { Movie, Genre } = require('../../../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'movies',
	description: 'Create, edit, remove and show movie suggestions',
	options: [
		{
			name: 'add',
			type: 'SUB_COMMAND',
			description: 'Create a movie suggestions',
			options: [
				{
					name: 'moviename',
					type: 'STRING',
					description: 'Name of the movie',
					required: true,
				},
				{
					name: 'genre',
					type: 'STRING',
					description: 'Genre of the movie',
					required: true,
				},
				{
					name: 'plattform',
					type: 'STRING',
					description: 'Plattform where the movie can be streamed',
					required: true,
				},
				{
					name: 'trailer',
					type: 'STRING',
					description: 'Link to the movie trailer',
					required: true,
				},
			],
		}, {
			name: 'delete',
			type: 'SUB_COMMAND',
			description: 'Delete a movie suggestions',
			options: [
				{
					name: 'moviename',
					type: 'STRING',
					description: 'Name of the movie you want to delete',
					required: true,
				},
			],
		}, {
			name: 'edit',
			type: 'SUB_COMMAND',
			description: 'Edit a movie suggestions',
			options: [
				{
					name: 'moviename',
					type: 'STRING',
					description: 'Name of the movie',
					required: true,
				},
				{
					name: 'genre',
					type: 'STRING',
					description: 'Genre of the movie',
					required: true,
				},
				{
					name: 'plattform',
					type: 'STRING',
					description: 'Plattform where the movie can be streamed',
					required: true,
				},
				{
					name: 'trailer',
					type: 'STRING',
					description: 'Link to the movie trailer',
					required: true,
				},
			],
		}, {
			name: 'show',
			type: 'SUB_COMMAND',
			description: 'Show movie suggestions',
			options: [
				{
					name: 'genre',
					type: 'STRING',
					description: 'Name of a genre you are looking for',
					required: false,
				},
			],
		}, {
			name: 'random',
			type: 'SUB_COMMAND',
			description: 'Show a random movie suggestion',
		},
	],
	defaultPermission: true,
	// Roles + Admins
	permissions: [
		{
			id: '766633420713230336',
			type: 'ROLE',
			permission: true,
		},
		{
			id: '599906769589764097',
			type: 'ROLE',
			permission: true,
		},
		{
			id: '139415003680735233',
			type: 'USER',
			permission: true,
		},
	],
	disable: async function(interaction) {
		await Movie.destroy({ where: { guild_id: interaction.guild.id } });
		interaction.client.commands.get('genre').disable(interaction);
	},
	enable: async function(interaction) {
		interaction.client.commands.get('genre').enable(interaction);
	},
	execute: async function(interaction) {
		if (interaction.options.first().name === 'add') {
			const args = interaction.options.first().options;
			const movieName = args.get('moviename').value;
			const movieGenreName = args.get('genre').value;
			const movieGenre = await Genre.findOne({ where: { name: movieGenreName, guild_id: interaction.guild.id } });
			const moviePlatform = args.get('plattform').value;
			const movieTrailer = args.get('trailer').value;

			if (!movieGenre) {
				return await interaction.reply(`${movieGenreName} ist kein verfügbares Genre.`, { ephemeral: true });
			}

			try {
				const movie = await Movie.create({
					name: movieName,
					genre_id: movieGenre.id,
					platform: moviePlatform,
					trailer: movieTrailer,
					user_id: interaction.user.id,
					guild_id: interaction.guild.id,

				});
				return await interaction.reply(`Film ${movie.name} wurde hinzugefügt.`, { ephemeral: true });
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					return await interaction.reply('Der Filme existiert bereits.', { ephemeral: true });
				}
				return await interaction.reply('Es gab beim hinzufügen einen Fehler.', { ephemeral: true });
			}
		}
		else if (interaction.options.first().name === 'edit') {
			const args = interaction.options.first().options;
			const movieName = args.get('moviename').value;
			const movieGenreName = args.get('genre').value;
			const movieGenre = await Genre.findOne({ where: { name: movieGenreName, guild_id: interaction.guild.id } });
			// const moviePlatform = args.get('plattform').value;
			// const movieTrailer = args.get('trailer').value;

			if (!movieGenre) {
				return await interaction.reply(`${movieGenreName} ist kein verfügbares Genre.`, { ephemeral: true });
			}

			// equivalent to: UPDATE tags (descrption) values (?) WHERE name = ?;
			const affectedRows = await Movie.update({ genre_id: movieGenre.id }, { where: { name: movieName, guild_id: interaction.guild.id } });
			if (affectedRows > 0) {
				return await interaction.reply(`Movie ${movieName} was edited.`, { ephemeral: true });
			}
			return await interaction.reply(`Could not find a movie with name ${movieName}.`, { ephemeral: true });
		}
		else if (interaction.options.first().name === 'delete') {
			const movieName = interaction.options.first().options.get('moviename').value;

			const rowCount = await Movie.destroy({ where: { name: movieName, guild_id: interaction.guild.id } });
			if (!rowCount) return await interaction.reply('That movie did not exist.', { ephemeral: true });

			return await interaction.reply('Movie deleted.', { ephemeral: true });
		}
		else if (interaction.options.first().name === 'show') {
			let movieList = [];

			if (interaction.options.first().options) {
				const movieGenreName = interaction.options.first().options.get('genre').value;
				const movieGenre = await Genre.findOne({ where: { name: movieGenreName, guild_id: interaction.guild.id } });

				movieList = await Movie.findAll({
					where: { genre_id: movieGenre.id, guild_id: interaction.guild.id },
					include: ['genre'],
				});
			}
			else {
				movieList = await Movie.findAll({
					where: { guild_id: interaction.guild.id },
					include: ['genre'],
				});
			}

			if (!movieList.length) return await interaction.reply('Es gibt keine Filme.', { ephemeral: true });

			const sortBy = movieList.reduce((groups, item) => {
				const group = (groups[item.genre_id] || []);
				group.push(item);
				groups[item.genre_id] = group;
				return groups;
			}, {});

			await interaction.reply('Filme werden ausgegeben', { ephemeral: true });

			Object.values(sortBy).forEach(async element => {

				let titleField = '';
				let platformField = '';
				let genre = '';
				let trailer = '';

				element.forEach(child => {
					genre = child.genre;
					titleField = titleField + child.name + '\n';
					platformField = platformField + child.platform + '\n';
					trailer = trailer + `[Trailer]( ${child.trailer})` + '\n';
				});

				const embed = new Discord.MessageEmbed()
					.setTitle(genre.name)
					.setColor(genre.color)
					.addFields(
						{ name: 'Title', value: titleField, inline: true },
						{ name: 'Platform', value: platformField, inline: true },
						{ name: 'Trailer', value: trailer, inline: true },
					);

				await interaction.followUp('', { ephemeral: true, embeds: [embed] });
			});

			return;
		}
		else if (interaction.options.first().name === 'random') {
			const movieList = await Movie.findAll({
				where: { guild_id: interaction.guild.id },
				include: ['genre'],
			});
			const movieCollection = new Discord.Collection();
			movieList.forEach(movie => {
				movieCollection.set(movie.id, movie);
			});
			const movie = movieCollection.random();
			if (!movie) return await interaction.reply('Es gibt keine Filme.', { ephemeral: true });
			const user = await interaction.client.users.fetch(movie.user_id);
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
			return interaction.followUp('', { ephemeral: true, embeds: [embed] });
		}
	},

};