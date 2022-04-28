module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		try {
			command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply('There was an error trying to execute that command!', { ephemeral: true });
		}
	}
};