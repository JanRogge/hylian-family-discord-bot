const { Gifts } = require('../../dbObjects');

module.exports = {
	name: 'giftSubscription',
	async start(client, userId) {
		const listener = client.listener;
		const subscription = await listener.subscribeToChannelSubscriptionGiftEvents(userId, async s => {
			console.log(s.broadcasterName);

			if (s.isAnonymous) {
				return;
			}

			await Gifts.create({
				user_id: s.gifterId,
				amount: s.amount,
				broadcaster_id: s.broadcasterId,
			});
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