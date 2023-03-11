const { Rewards, Settings } = require('../../dbObjects');
const { Sequelize, Op } = require('sequelize');
const { updateTicketMessage, fetchTicketMessage, fetchData } = require('../../components/ticketsMessage');

module.exports = {
	name: 'redemptionSubscription',
	async start(client, userId) {
		const listener = client.listener;
		const settings = await Settings.findOne({
			where: {
				twitch_id: userId,
			},
		});

		const blub = new Date();
		const test1 = blub.getMonth() + 1;
		const test2 = blub.getFullYear();

		const userAuthClient = client.authClients.get(userId);
		console.log(`${test2}-${test1}-01T08:00:00.0Z`);
		console.log(new Date(`${test2}-${test1}-01T08:00:00.0Z`).toISOString());
		
		const leaderboard = userAuthClient.bits.getLeaderboard(
			userId,
			{
				count: 2,
				period: 'month',
				startDate: new Date(`${test2}-${test1}-01T08:00:00.0Z`),
			},
		);

		let subscription;
		if (settings && settings.reward_id) {
			subscription = await listener.subscribeToChannelRedemptionAddEventsForReward(userId, settings.reward_id, async s => {
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

					console.log(s.userId + 'hatte schon ein Los diesen monat!');
					// const rewardRedemption = authClient.channelPoints.getRedemptionById(userId, s.rewardId, s.id);
					// await rewardRedemption.updateStatus('CANCELED');

					return;
				}

				await Rewards.create({
					user_id: s.userId,
					broadcaster_id: s.broadcasterId,
					won: false,
				});

				const { channel, message } = await fetchTicketMessage(
					client,
					settings.guild_id,
					{
						month,
						year,
					},
				);

				if (!message) {
					return;
				}

				const { redemptionUsers } = await fetchData(client, { month, year }, userId);

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
		}
		else {
			subscription = await listener.subscribeToChannelRedemptionAddEvents(userId, async s => {
				console.log(`Reward ${s.rewardTitle} mit der ID ${s.rewardId} wurde eingelöst`);
			});
		}

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