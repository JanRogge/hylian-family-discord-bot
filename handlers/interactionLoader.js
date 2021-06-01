const { readdirSync } = require('fs');

module.exports = async (client) => {
	const data = [];
	readdirSync('./interactions/global').forEach(dir => {
		const commandFiles = readdirSync(`./interactions/global/${dir}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`../interactions/global/${dir}/${file}`);
			client.commands.set(command.name, command);
			data.push(
				{
					name: command.name,
					description: command.description,
					options: command.options,
					defaultPermission: command.defaultPermission,
				},
			);
		}
	});
	readdirSync('./interactions/guild').forEach(dir => {
		const commandFiles = readdirSync(`./interactions/guild/${dir}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`../interactions/guild/${dir}/${file}`);
			client.commands.set(command.name, command);
		}
	});
	await client.application.commands.set(data);
};