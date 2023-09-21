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

		let subscription;
		if (settings && settings.reward_id) {
			subscription = await listener.onChannelRedemptionAddForReward(userId, settings.reward_id, async s => {
				console.log('Redemption');

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


				let rewardRedemption;
				try {
					rewardRedemption = await client.apiClient.channelPoints.getRedemptionById(userId, s.rewardId, s.id);
				}
				catch (error) {
					console.log('Error fetching channel point redemption automatic cancelation not possible');
					console.log(error);
				}

				if (redemption) {
					console.log(s.userId + 'hat schon ein Los diesen Monat eingelöst!');
					if (rewardRedemption) {
						await rewardRedemption.updateStatus('CANCELED');
					}

					return;
				}

				await Rewards.create({
					user_id: s.userId,
					broadcaster_id: s.broadcasterId,
					won: false,
				});

				if (rewardRedemption) {
					// await rewardRedemption.updateStatus('FULFILLED');
				}

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
			subscription = await listener.onChannelRedemptionAdd(userId, async s => {
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