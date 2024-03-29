const { Messages, Settings, Gifts, Rewards } = require('../dbObjects');
const { Sequelize, Op } = require('sequelize');

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
	'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

module.exports = {
	fetchData: async function(client, date, broadcaster) {
		const authClient = client.apiClient;
		let topCheerer;
		let topGifter;
		let redemptionUsers;

		const gifts = await Gifts.findOne({
			attributes: [
				'user_id',
				[Sequelize.fn('sum', Sequelize.col('amount')), 'totalGifts'],
			],
			where: {
				[Op.and] : [
					Sequelize.fn('EXTRACT(MONTH from "createdAt") =', date.month),
					Sequelize.fn('EXTRACT(YEAR from "createdAt") =', date.year),
				],
				broadcaster_id: broadcaster,
			},
			order: [
				['totalGifts', 'DESC'],
			],
			group: 'user_id',
		});
		if (gifts) {
			topGifter = await authClient.users.getUserById(gifts.user_id);
		}

		const leaderboard = await client.apiClient.bits.getLeaderboard(
			broadcaster,
			{
				count: 2,
				period: 'month',
				startDate: new Date(`${date.year}-${String(date.month).padStart(2, '0')}-01T08:00:00.0Z`),
			},
		);

		if (leaderboard.entries.length >= 1 && gifts) {
			if (gifts.user_id !== leaderboard.entries[0].userId) {
				topCheerer = await authClient.users.getUserById(leaderboard.entries[0].userId);
			}
			else {
				topCheerer = await authClient.users.getUserById(leaderboard.entries[1].userId);
			}
		}

		const redemptions = await Rewards.findAll({
			attributes: [
				'user_id',
			],
			where: {
				[Op.and] : [
					Sequelize.fn('EXTRACT(MONTH from "createdAt") =', date.month),
					Sequelize.fn('EXTRACT(YEAR from "createdAt") =', date.year),
				],
				broadcaster_id: broadcaster,
			},
		});

		if (redemptions) {
			const redemptionUserIds = [];
			for (const redemption of redemptions) {
				redemptionUserIds.push(redemption.user_id);
			}

			redemptionUsers = await authClient.users.getUsersByIds(redemptionUserIds);
		}


		return {
			topGifter,
			topCheerer,
			redemptionUsers,
		};
	},

	fetchTicketMessage: async function(client, guildId, date) {
		const settings = await Settings.findOne({
			where: { guild_id: guildId },
		});

		const channel = await client.channels.fetch(settings.reward_channel_id);

		const message = await Messages.findOne({
			where: {
				guild_id: guildId,
				[Op.and] : [
					Sequelize.fn('EXTRACT(MONTH from "createdAt") =', date.month),
					Sequelize.fn('EXTRACT(YEAR from "createdAt") =', date.year),
				],
			},
		});

		return {
			channel,
			message,
		};
	},
	createNewTicketMessage: async function(channel) {
		const now = new Date();
		const template = `**Glückslose ${monthNames[now.getMonth()]} ${now.getFullYear()}:**\n` +
            '\n' +
            '\n' +
            '\n' +
            '**Gewinner:**\n' +
            'Top-Subgifter: \n' +
            'Top-Cheerer: \n' +
            'Los-Gewinner:\n';

		const message = await channel.send({
			content: template,
		});

		await Messages.create({
			guild_id: message.guildId,
			channel_id: message.channelId,
			message_id: message.id,
			name: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
			done: false,
		});
	},
	updateTicketMessage: async function(messageToUpdateId, channel, date, redemptions, top) {
		const template = `**Glückslose ${monthNames[date.month - 1]} ${date.year}:**\n` +
        '\n' +
        `${redemptions ? redemptions : '\n'}` +
        '\n' +
        '**Gewinner:**\n' +
        `Top-Subgifter: ${top.gifter ? top.gifter.displayName : ''}\n` +
        `Top-Cheerer: ${top.cheerer ? top.cheerer.displayName : ''}\n` +
        `Los-Gewinner: ${top.winner ? top.winner.displayName : ''}\n`;

		await channel.messages.edit(messageToUpdateId, {
			content: template,
		});
	},
};