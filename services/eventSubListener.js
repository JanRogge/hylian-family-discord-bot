const { AppTokenAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { EventSubHttpListener, EnvPortAdapter } = require('@twurple/eventsub-http');
const { NgrokAdapter } = require('@twurple/eventsub-ngrok');
const { Collection } = require('discord.js');

module.exports = {
	async start(client) {
		const authProvider = new AppTokenAuthProvider(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET);
		const apiClient = new ApiClient({ authProvider });
		let adapter;

		if (process.env.NODE_ENV === 'development') {
			await apiClient.eventSub.deleteAllSubscriptions();

			adapter = new NgrokAdapter();
		}

		if (process.env.NODE_ENV === 'production') {
			await apiClient.eventSub.deleteAllSubscriptions();

			adapter = new EnvPortAdapter({
				hostName: `${process.env.APP_NAME}.herokuapp.com`,
			});
		}

		const listener = new EventSubHttpListener({
			apiClient,
			adapter: adapter,
			secret: 'hyperSecretWord',
			strictHostCheck: true,
			legacySecrets: true,
		});
		await listener.start();

		client.listener = listener;
		client.subs = new Collection();

		client.appClient = apiClient;
	},
};