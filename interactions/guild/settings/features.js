const { Permissions } = require('discord.js');

module.exports = {
	name: 'features',
	description: 'Enable and disable features',
	options: [
		{
			name: 'activate',
			type: 'SUB_COMMAND',
			description: 'Enable a feature!',
			options: [
				{
					name: 'commandname',
					type: 'STRING',
					description: 'Name of the Feature you want to enable',
					required: true,
					choices: [
						{
							name: 'Movie suggestions',
							value: 'movies',
						},
						{
							name: 'Voice verlinkung',
							value: 'voicelink',
						},
						{
							name: 'Code sharing',
							value: 'codes',
						},
					],
				},
			],
		}, {
			name: 'deactivate',
			type: 'SUB_COMMAND',
			description: 'Disable a feature!',
			options: [
				{
					name: 'commandname',
					type: 'STRING',
					description: 'Name of the Feature you want to disable',
					required: true,
					choices: [
						{
							name: 'Movie suggestions',
							value: 'movies',
						},
						{
							name: 'Voice verlinkung',
							value: 'voicelink',
						},
						{
							name: 'Code sharing',
							value: 'codes',
						},
					],
				},
			],
		},
	],
	defaultPermission: true,
	execute: async function(interaction) {
		if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return await interaction.reply('You don\'t have the permission to activate or deactivate features on this server.', { ephemeral: true });

		const choiceValue = interaction.options.first().options.get('commandname').value;

		if (interaction.options.first().name === 'activate') {
			const command = interaction.client.commands.get(choiceValue);
			const slashCommand = await interaction.client.guilds.cache.get(interaction.guild.id).commands.create(
				{
					name: command.name,
					description: command.description,
					options: command.options,
					defaultPermission: command.defaultPermission,
				},
			);
			// interaction.guild.ownerID User ID des Server Owners vielleicht alle commands standardmäßig für den owner erlauben
			const test = await interaction.guild.commands.fetch(slashCommand.id);
			test.setPermissions(command.permissions);
			command.enable(interaction);

			return await interaction.reply(`Command ${command.name} is now active.`, { ephemeral: true });
		}
		else if (interaction.options.first().name === 'deactivate') {
			const globalCommands = await interaction.guild.commands.fetch();
			const command = globalCommands.find(cmd => cmd.name === choiceValue);

			if (!command) return await interaction.reply(`Command ${command.name} is not active!`, { ephemeral: true });

			interaction.client.commands.get(choiceValue).disable(interaction);
			await interaction.client.guilds.cache.get(interaction.guild.id).commands.delete(command.id);

			return await interaction.reply(`Command ${command.name} is now deactivated`, { ephemeral: true });
		}
	},
};