const { Rewards } = require('../../dbObjects');
const { Sequelize, Op } = require('sequelize');
const { updateTicketMessage, fetchTicketMessage, fetchData } = require('../../components/ticketsMessage');

module.exports = {
	name: 'redemptionSubscription',
	async start(client, userId) {
		const listener = client.listener;
		const subscription = await listener.subscribeToChannelRedemptionAddEvents(userId, async s => {
			const today = new Date();
			const month = today.getMonth() + 1;
			const year = today.getFullYear();

			const redemption = await Rewards.findOne({
				where: {
					user_id: s.userId,
					broadcaster_id: s.broadcasterId,
					[Op.and] : [
						Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month),
						Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year),
					],
				},
			});

			if (redemption) {
				const authClient = client.authClients.get(userId);

				const rewardRedemption = authClient.channelPoints.getRedemptionById(userId, s.rewardId, s.id);
				await rewardRedemption.updateStatus('CANCELED');

				return;
			}

			await Rewards.create({
				user_id: s.userId,
				broadcaster_id: s.broadcasterId,
			});

			const { channel, message } = await fetchTicketMessage(
				client,
				'599895341487226881',
				{
					month,
					year,
				},
			);

			if (!message) {
				return;
			}

			const { redemptionUsers } = await fetchData(client, { month, year });

			const sortedUserNames = [];
			for (const redemptionUser of redemptionUsers) {
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

			let redemptionsString = '';
			for (const sortedUserName of sortedUserNames) {
				redemptionsString += `${sortedUserName}\n`;
			}

			await updateTicketMessage(
				message.message_id,
				channel,
				{
					month,
					year,
				},
				redemptionsString,
				{},
			);
		});

		console.log(await subscription.getCliTestCommand());

		const subs = client.subs.get(userId);
		subs.set(this.name, subscription);
	},
	async stop(client, userId) {
		const subscription = client.subs.get(userId).get(this.name);
		subscription.stop();

		client.subs.get(userId).delete(this.name);
	},
};