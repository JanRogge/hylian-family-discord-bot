const { TwitchAuth } = require('../../dbObjects');

module.exports = {
	async start(client) {
		const listener = client.listener;
		const authSubscription = await listener.onUserAuthorizationRevoke(process.env.TWITCH_CLIENT_ID, async e => {
			console.log(`${e.userId} just revoked auth!`);

			const data = client.subs.get(e.userId);

			for (const sub of data) {
				sub.stop();
			}

			client.subs.delete(e.userId);
			client.authProvider.removeUser(e.userId);

			await TwitchAuth.destroy({ where: { user_id: e.userId } });
		});

		console.log(await authSubscription.getCliTestCommand());
	},
};