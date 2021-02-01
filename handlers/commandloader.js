const { readdirSync } = require('fs');

module.exports = (client) => {
	readdirSync('./commands/').forEach(dir => {
		const commandFiles = readdirSync(`./commands/${dir}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`../commands/${dir}/${file}`);
			client.commands.set(command.name, command);
		}
	});
};