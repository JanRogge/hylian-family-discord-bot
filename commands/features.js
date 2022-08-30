const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { VoiceRoleLink } = require('../dbObjects');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('features')
		.setDescription('Enable and disable features')
        .addSubcommand(subcommmand =>
            subcommmand.setName('activate')
                .setDescription('Enable a feature!')
                .addStringOption(option =>
                    option.setName('commandname')
                        .setDescription('Name of the Feature you want to enable')
                        .setRequired(true)
						.addChoices(
							{name: 'Voice verlinkung', value: 'voicelink'},
							{name: 'Code sharing', value: 'codes'},
						))
        )
        .addSubcommand(subcommmand =>
            subcommmand.setName('deactivate')
                .setDescription('Disable a feature!')
                .addStringOption(option =>
                    option.setName('commandname')
                        .setDescription('Name of the Feature you want to disable')
                        .setRequired(true)
                        .addChoices(
							{name: 'Voice verlinkung', value: 'voicelink'},
							{name: 'Code sharing', value: 'codes'},
						))
                
        )
        .setDefaultPermission(false),
	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return await interaction.reply('You don\'t have the permission to activate or deactivate features on this server.', { ephemeral: true });

		const commandname = interaction.options.getString('commandname');

		if (interaction.options.getSubcommand() === 'activate') {
			const command = interaction.client.commands.get(commandname);
			const slashCommand = await interaction.client.guilds.cache.get(interaction.guild.id).commands.create(
				command.data.toJSON()
			);
			command.enable(interaction);

			return await interaction.reply({ content: `Command ${commandname} is now active.`, ephemeral: true });
		}
		else if (interaction.options.getSubcommand() === 'deactivate') {
			const globalCommands = await interaction.guild.commands.fetch();
			const command = globalCommands.find(cmd => cmd.name === commandname);

			if (!command) return await interaction.reply({ content: `Command ${commandname} is not active!`, ephemeral: true });

			interaction.client.commands.get(commandname).disable(interaction);
			await interaction.client.guilds.cache.get(interaction.guild.id).commands.delete(command.id);

			return await interaction.reply({ content: `Command ${commandname} is now deactivated`, ephemeral: true });
		}
	},
};