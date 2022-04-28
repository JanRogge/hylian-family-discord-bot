const { readdirSync } = require('fs');
const { Collection } = require('discord.js');

module.exports = (client) => {
	client.commands = new Collection();

	const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const command = require(`../commands/${file}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
	}

	const featureCommandFiles = readdirSync('./commands/features').filter(file => file.endsWith('.js'));

	for (const file of featureCommandFiles) {
		const command = require(`../commands/features/${file}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
	}
};
