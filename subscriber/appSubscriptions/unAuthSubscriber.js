const { TwitchAuth } = require('../../dbObjects');

module.exports = {
	async start(client) {
		const listener = client.listener;
		const authSubscription = await listener.subscribeToUserAuthorizationRevokeEvents(process.env.TWITCHCLIENTID, async e => {
			console.log(`${e.userId} just added auth!`);

			const data = client.subs.get(e.userId);

			for (const sub of data) {
				sub.stop();
			}

			client.subs.delete(e.userId);
			client.authClients.delete(e.userId);

			await TwitchAuth.destroy({ where: { user_id: e.userId } });
			console.log(client.subs);
			console.log(client.authClients);
		});

		console.log(await authSubscription.getCliTestCommand());
	},
};