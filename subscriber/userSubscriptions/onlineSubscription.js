module.exports = {
	name: 'onlineSubscription',
	async start(client, userId) {
		const listener = client.listener;
		const subscription = await listener.subscribeToStreamOnlineEvents(userId, async s => {
			console.log(s.broadcasterName);
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