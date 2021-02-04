const Keyv = require('keyv');

const prefixes = new Keyv(process.env.DATABASE_URL);
const globalPrefix = '.';

prefixes.on('error', err => console.log('Connection Error', err));

module.exports = {
	name: 'prefix',
	description: 'Changes the prefix!',
	category: 'general',
	args: false,
	execute: async function(message, args) {
		// if there's at least one argument, set the prefix
		if (args.length) {
			await prefixes.set(message.guild.id, args[0]);
			return message.channel.send(`Successfully set prefix to \`${args[0]}\``);
		}

		return message.channel.send(`Prefix is \`${await prefixes.get(message.guild.id) || globalPrefix}\``);
	},

};