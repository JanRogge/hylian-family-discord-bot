module.exports = {
	name: 'help',
	description: 'Shows all available commands',
	options: [{
		name: 'command',
		type: 'STRING',
		description: 'Name of a Command',
		required: false,
	}],
	defaultPermission: true,
	execute: async function(interaction) {
		const args = interaction.options;
		const data = [];
		let globalCommands = await interaction.client.application.commands.fetch();
		if (interaction.guild) {
			globalCommands = globalCommands.concat(await interaction.guild.commands.fetch());
		}

		if (!args.length) {
			data.push('Here\'s a list of all my commands:');
			data.push(globalCommands.map(command => command.name).join(', '));
			data.push('\nYou can send `/help [command name]` to get info on a specific command!');

			return await interaction.reply(data, { ephemeral: true });
		}

		const name = args[0].value;
		const command = globalCommands.get(name);

		if (!command) {
			return await interaction.reply('That\'s not a valid command!', { ephemeral: true });
		}

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** /${command.name} ${command.usage}`);

		data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

		await interaction.reply(data, { ephemeral: true });
	},
};