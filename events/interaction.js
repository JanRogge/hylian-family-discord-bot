module.exports = async (client, interaction) => {
	if (!interaction.isCommand()) return;

	const commandName = interaction.commandName;

	const command = client.commands.get(commandName);
	try {
		command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply('there was an error trying to execute that command!', { ephemeral: true });
	}
};