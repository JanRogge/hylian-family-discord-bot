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
		if (interaction.options[0].name === 'activate') {
			const command = interaction.client.commands.get(interaction.options[0].options[0].value);
			await interaction.client.guilds.cache.get(interaction.guild.id).commands.create(
				{
					name: command.name,
					description: command.description,
					options: command.options,
					defaultPermission: command.defaultPermission,
				},
			);

			return await interaction.reply(`Command ${command.name} is now active.`, { ephemeral: true });
		}
		else if (interaction.options[0].name === 'deactivate') {
			const globalCommands = await interaction.guild.commands.fetch();
			const command = globalCommands.find(cmd => cmd.name === interaction.options[0].options[0].value);

			if (!command) return await interaction.reply(`Command ${command.name} is not active!`, { ephemeral: true });

			await interaction.client.guilds.cache.get(interaction.guild.id).commands.delete(command.id);

			return await interaction.reply(`Command ${command.name} is now deactivated`, { ephemeral: true });
		}
	},
};