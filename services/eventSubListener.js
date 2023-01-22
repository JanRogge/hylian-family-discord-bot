const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { EventSubHttpListener, EnvPortAdapter } = require('@twurple/eventsub-http');
const { NgrokAdapter } = require('@twurple/eventsub-ngrok');
const { Collection } = require('discord.js');

module.exports = {
	async start(client) {
		const authProvider = new ClientCredentialsAuthProvider(process.env.TWITCHCLIENTID, process.env.TWITCHCLIENTSECRET);
		const apiClient = new ApiClient({ authProvider });
		let adapter;

		if (process.env.NODE_ENV === 'development') {
			await apiClient.eventSub.deleteAllSubscriptions();

			adapter = new NgrokAdapter();
		}

		if (process.env.NODE_ENV === 'production') {
			adapter = new EnvPortAdapter({
				hostName: `${process.env.APP_NAME}.herokuapp.com`,
			});
		}

		const listener = new EventSubHttpListener({
			apiClient,
			adapter: adapter,
			secret: 'bluber',
			strictHostCheck: true,
		});
		await listener.start();

		client.listener = listener;
		client.authClients = new Collection();
		client.subs = new Collection();

		client.authClients.set('app', apiClient);
	},
};