const { Settings } = require('../../dbObjects');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'onlineSubscription',
	async start(client, userId) {
		const listener = client.listener;
		const subscription = await listener.subscribeToStreamOnlineEvents(userId, async s => {
			console.log(s.broadcasterName);

			const stream = await s.getStream();

			if (!stream) {
				return;
			}

			const user = await s.getBroadcaster();

			if (!user) {
				return;
			}

			const settings = await Settings.findOne({
				where: {
					twitch_id: userId,
				},
			});

			const channel = await client.channels.fetch(settings.live_channel_id);

			const exampleEmbed = new EmbedBuilder()
				.setColor(0x00F7F7)
				.setTitle(stream.title)
				.setURL('https://www.twitch.tv/hylian_tami')
				.setAuthor({ name: user.displayName, iconURL: user.profilePictureUrl })
				.setThumbnail(user.profilePictureUrl)
				.setImage(stream.thumbnailUrl);

			const template = 'Hey @everyone, hylian_tami, ist jetzt live https://twitch.tv/hylian_tami !\n' +
            'Kommt rein, ich freue mich auf euch! :HyHeart:\n';

			await channel.send({
				content: template,
				embeds: [exampleEmbed],
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