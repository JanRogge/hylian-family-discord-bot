const { Collection } = require('discord.js');
const { readdirSync } = require('fs');
const twitchApiClient = require('../../services/twitchApiClient');

module.exports = {
	async start(client) {
		const listener = client.listener;
		const authSubscription = await listener.subscribeToUserAuthorizationGrantEvents(process.env.TWITCHCLIENTID, async e => {
			console.log(`${e.userId} just added auth!`);
			await twitchApiClient.start(client, e.userId);

			client.subs.set(e.userId, new Collection());

			const subscriberFiles = readdirSync('./subscriber/userSubscriptions').filter(file => file.endsWith('.js'));

			console.log(subscriberFiles);

			for (const file of subscriberFiles) {
				const subscription = require(`../userSubscriptions/${file}`);

				try {
					await subscription.start(client, e.userId);
				}
				catch (error) {
					console.error(error);
				}
			}
		});

		console.log(await authSubscription.getCliTestCommand());
	},
};