require('dotenv').config();
const { Client, Intents, Collection } = require('discord.js');

const client = new Client(
	{
		presence: {
			activity: { name: 'VSCode', type: 'PLAYING' },
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

client.commands = new Collection();

// require('./handlers/commandloader')(client);
require('./handlers/events')(client);

client.login();
