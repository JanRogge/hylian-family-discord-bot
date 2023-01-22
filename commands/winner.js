const { SlashCommandBuilder } = require('discord.js');
const { Rewards, Messages, Settings } = require('../dbObjects');
const { Sequelize, Op } = require('sequelize');
const { updateTicketMessage, fetchData } = require('../components/ticketsMessage');

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
	'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];


module.exports = {
	data: new SlashCommandBuilder()
		.setName('select-a-winner')
		.setDescription('Provides information about the server.')
		.addStringOption(option =>
			option.setName('monat-jahr')
				.setDescription('Phrase to search for')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Phrase to search for')
				.setAutocomplete(true)
				.setRequired(true)),
	async execute(interaction) {
		const settings = await Settings.findOne({
			where: { guild_id: interaction.guildId },
		});

		const channel = await interaction.client.channels.fetch(settings.reward_channel_id);

		const message = await Messages.findOne({
			where: {
				guild_id: settings.guild_id,
				name: interaction.options.getString('monat-jahr'),
				done: false,
			},
		});

		const dateOption = interaction.options.getString('monat-jahr');

		if (!dateOption) {
			await interaction.reply({ content: 'Fehler kein Monat ausgewählt!', ephemeral: true });
			return;
		}

		const dateSeperate = dateOption.split(' ');

		const { topGifter, topCheerer, redemptionUsers } = await fetchData(interaction.client, { month: monthNames.indexOf(dateSeperate[0]) + 1, year: dateSeperate[1] }, settings.twitch_id);

		let winner;
		let redemptionsString = '';
		const sortedUserNames = [];
		for (const redemptionUser of redemptionUsers) {
			if (redemptionUser.displayName === interaction.options.getString('user')) {
				winner = redemptionUser;
			}
			sortedUserNames.push(redemptionUser.displayName);
		}
		sortedUserNames.sort((a, b) => {
			const nameA = a.toUpperCase();
			const nameB = b.toUpperCase();
			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			return 0;
		});

		for (const sortedUserName of sortedUserNames) {
			if (sortedUserName === interaction.options.getString('user')) {
				redemptionsString += `*${sortedUserName} (Winner)*\n`;
			}
			else {
				redemptionsString += `${sortedUserName}\n`;
			}
		}

		await updateTicketMessage(
			message.message_id,
			channel,
			{
				month: monthNames.indexOf(dateSeperate[0]) + 1,
				year: dateSeperate[1],
			},
			redemptionsString,
			{
				gifter: topGifter,
				cheerer: topCheerer,
				winner,
			},
		);

		await Messages.update(
			{ done: true },
			{
				where: {
					id: message.id,
				},
			});

		await Rewards.update(
			{ won: true },
			{
				where: {
					user_id: winner.id,
				},
			});

		await interaction.reply({ content: 'Gewinner wurde eingetragen!', ephemeral: true });
	},
	async autocomplete(interaction) {
		const authClient = interaction.client.authClients.get('app');

		const settings = await Settings.findOne({
			where: { guild_id: interaction.guildId },
		});

		const focusedOption = interaction.options.getFocused(true);
		const choices = [];

		if (focusedOption.name === 'monat-jahr') {
			const messages = await Messages.findAll({
				attributes: [
					'name',
					'message_id',
					'createdAt',
				],
				where: {
					guild_id: settings.guild_id,
					channel_id: settings.reward_channel_id,
					done: false,
				},
			});

			for (const message of messages) {
				choices.push(message.name);
			}
		}

		if (focusedOption.name === 'user') {
			const dateOption = interaction.options.get('monat-jahr', true);
			const dateSeperate = dateOption.value.split(' ');

			const userIds = [];

			const redemptions = await Rewards.findAll({
				where: {
					[Op.and] : [
						Sequelize.fn('EXTRACT(MONTH from "createdAt") =', monthNames.indexOf(dateSeperate[0]) + 1),
						Sequelize.fn('EXTRACT(YEAR from "createdAt") =', dateSeperate[1]),
					],
					broadcaster_id: settings.twitch_id,
				},
			});


			for (const redemption of redemptions) {
				userIds.push(redemption.user_id);
			}

			const users = await authClient.users.getUsersByIds(userIds);

			for (const user of users) {
				choices.push(user.displayName);
			}
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
};