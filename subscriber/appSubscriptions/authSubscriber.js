const { Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { Settings } = require('../../dbObjects');
const { Op } = require('sequelize');
const twitchApiClient = require('../../services/twitchApiClient');

module.exports = {
	async start(client) {
		const guildSettings = await Settings.findAll({
			where: {
				twitch_id: {
					[Op.ne]: null,
				},
			},
		});
		for (const settings of guildSettings) {
			await this.add(client, settings.twitch_id);
		}

		const listener = client.listener;
		const authSubscription = await listener.subscribeToUserAuthorizationGrantEvents(process.env.TWITCH_CLIENT_ID, async e => {
			console.log(`${e.userId} just added auth!`);
			await this.add(client, e.userId);
		});

		console.log(await authSubscription.getCliTestCommand());
	},
	async add(client, userId) {
		await twitchApiClient.start(client, userId);

		client.subs.set(userId, new Collection());

		const subscriberFiles = readdirSync('./subscriber/userSubscriptions').filter(file => file.endsWith('.js'));

		for (const file of subscriberFiles) {
			const subscription = require(`../userSubscriptions/${file}`);

			try {
				await subscription.start(client, userId);
			}
			catch (error) {
				console.error(error);
			}
		}
	},
};