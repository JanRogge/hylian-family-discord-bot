require('dotenv').config();
const { Client, Intents } = require('discord.js');

const client = new Client(
	{
		presence: {
			activities: [{ name: 'hylian_tami', type: 'STREAMING', url: 'twitch.tv/hylian_tami' }],
			status: 'online',
		},

		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MEMBERS,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_VOICE_STATES,
		],
	},
);

require('./handlers/commandLoader')(client);
require('./handlers/events')(client);

client.login();
