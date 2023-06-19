const { SlashCommandBuilder } = require('discord.js');
const { Messages, Settings } = require('../dbObjects');
const { updateTicketMessage, fetchData } = require('../components/ticketsMessage');

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
	'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];


module.exports = {
	data: new SlashCommandBuilder()
		.setName('update-gifter')
		.setDescription('Update the gifter winner for a month.')
		.addStringOption(option =>
			option.setName('monat-jahr')
				.setDescription('Phrase to search for')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Phrase to search for')
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

		const { topCheerer, redemptionUsers } = await fetchData(interaction.client, { month: monthNames.indexOf(dateSeperate[0]) + 1, year: dateSeperate[1] }, settings.twitch_id);

		let winner;
		let redemptionsString = '';
		const sortedUserNames = [];
		for (const redemptionUser of redemptionUsers) {
			if (redemptionUser.won) {
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
			if (winner && sortedUserName === winner.displayName) {
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
				gifter: {
					displayName: interaction.options.getString('user'),
				},
				cheerer: topCheerer,
				winner,
			},
		);

		await interaction.reply({ content: 'Gifter wurde geändert!', ephemeral: true });
	},
	async autocomplete(interaction) {
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
				},
			});

			for (const message of messages) {
				choices.push(message.name);
			}
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
};