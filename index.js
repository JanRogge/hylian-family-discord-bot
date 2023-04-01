require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const eventSubListener = require('./services/eventSubListener');
const cron = require('./services/cron');
const authSubscriber = require('./subscriber/appSubscriptions/authSubscriber');
const { Rewards, Settings } = require('./dbObjects');

const client = new Client(
	{
		presence: {
			activities: [{ name: 'hylian_tami', type: 'WATCHING', url: 'https://twitch.tv/hylian_tami' }],
			status: 'online',
		},

		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildVoiceStates,
		],
	},
);

(async () => {
	await Rewards.create({
		user_id: '106164318',
		broadcaster_id: '232481838',
		won: false,
	});

	await Rewards.create({
		user_id: '106164318',
		broadcaster_id: '232481838',
		won: false,
	});


	require('./handlers/commandLoader')(client);
	require('./handlers/events')(client);
	await eventSubListener.start(client);
	await authSubscriber.start(client);
	cron.start(client);
})();

client.login();
