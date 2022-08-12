require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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

require('./handlers/commandLoader')(client);
require('./handlers/events')(client);

client.login();
