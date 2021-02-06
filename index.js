require('dotenv').config();
const Discord = require('discord.js');

const client = new Discord.Client(
	{
		presence: {
			activity: { name: 'VSCode', type: 'PLAYING' },
			status: 'online',
		},
	},
);

client.commands = new Discord.Collection();

require('./handlers/commandloader')(client);
require('./handlers/events')(client);

client.login();
