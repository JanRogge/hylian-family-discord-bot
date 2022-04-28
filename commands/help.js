const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows all available commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Name of a Command')
                .setRequired(false))
        .setDefaultPermission(true),
	async execute(interaction) {
		const commandName = interaction.options.getString('command');
		const data = [];
		let globalCommands = await interaction.client.application.commands.fetch();
		if (interaction.guild) {
			const guildCommands = await interaction.guild.commands.fetch();
			globalCommands = globalCommands.concat(guildCommands);
		}

		if (!commandName) {
			data.push('Here\'s a list of all my commands:\n');
			data.push(globalCommands.map(command => command.name).join(', '));
			data.push('\nYou can send `/help [command name]` to get info on a specific command!');

			return await interaction.reply({ content: data.join(), ephemeral: true });
		}

		const command = globalCommands.find(com => com.name === commandName);

		if (!command) {
			return await interaction.reply({ content: 'That\'s not a valid command!', ephemeral: true });
		}

		data.push(`**Name:** ${command.name}`);

		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** /${command.name} ${command.usage}`);

		await interaction.reply({ content: data.join(), ephemeral: true });
	},
};