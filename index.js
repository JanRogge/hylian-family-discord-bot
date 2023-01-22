require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const oAuthServer = require('./services/oAuthServer');
const eventSubListener = require('./services/eventSubListener');
const cron = require('./services/cron');
const authSubscriber = require('./subscriber/appSubscriptions/authSubscriber');

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
	require('./handlers/commandLoader')(client);
	require('./handlers/events')(client);
	oAuthServer();
	await eventSubListener.start(client);
	await authSubscriber.start(client);
	cron.start(client);
})();

client.login();
