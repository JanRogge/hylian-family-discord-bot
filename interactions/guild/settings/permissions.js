module.exports = {
	name: 'permissions',
	description: 'Change which user or role is allowed to use slash-commands',
	options: [
		{
			name: 'add',
			type: 'SUB_COMMAND',
			description: 'Allow a user or role to use a slash-command',
			options: [
				{
					name: 'commandname',
					type: 'STRING',
					description: 'Name of the Feature you want to edit permissions for',
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
				}, {
					name: 'name',
					type: 'MENTIONABLE',
					description: 'Name of the user or role',
					required: true,
				},
			],
		},
		{
			name: 'remove',
			type: 'SUB_COMMAND',
			description: 'Disallow a user or role to use a slash-command',
			options: [
				{
					name: 'commandname',
					type: 'STRING',
					description: 'Name of the Feature you want to edit permissions for',
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
				}, {
					name: 'name',
					type: 'MENTIONABLE',
					description: 'Name of the user or role',
					required: true,
				},
			],
		},
		{
			name: 'show',
			type: 'SUB_COMMAND',
			description: 'Show which roles and users can use a command',
			options: [
				{
					name: 'commandname',
					type: 'STRING',
					description: 'Name of the Feature you want to edit permissions for',
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
	// Only Admins
	permissions: [
		{
			id: '139415003680735233',
			type: 'USER',
			permissions: true,
		},
	],
	disable: async function() {
		return;
	},
	enable: async function() {
		return;
	},
	execute: async function(interaction) {
		if (interaction.options[0].name === 'add') {
			const commandName = interaction.options[0].options[0].value;
			const userOrRole = interaction.options[0].options[1];

			const globalCommands = await interaction.guild.commands.fetch();
			const command = globalCommands.find(cmd => cmd.name === commandName);

			if (!command) return await interaction.reply(`Command ${command.name} is not active!`, { ephemeral: true });

			let currentPerms = [];
			try {
				currentPerms = await interaction.client.guilds.cache.get(interaction.guild.id).commands.fetchPermissions(command.id);
			}
			catch (e) {
				console.log(e);
			}

			if (currentPerms.find(perm => perm.id === userOrRole.value)) return await interaction.reply('Command can already be used by this user or role!', { ephemeral: true });

			const type = userOrRole.user ? 'USER' : 'ROLE';

			currentPerms.push({
				id: userOrRole.value,
				type: type,
				permission: true,
			});

			await interaction.client.guilds.cache.get(interaction.guild.id).commands.setPermissions(command.id, currentPerms);
			const mention = type === 'USER' ? `<@${userOrRole.value}>` : `<@&${userOrRole.value}>`;
			return await interaction.reply(`${mention} now has access to ${command.name}.`, { ephemeral: true });
		}
		else if (interaction.options[0].name === 'remove') {
			const commandName = interaction.options[0].options[0].value;
			const userOrRole = interaction.options[0].options[1];

			const globalCommands = await interaction.guild.commands.fetch();
			const command = globalCommands.find(cmd => cmd.name === commandName);

			if (!command) return await interaction.reply(`Command ${command.name} is not active!`, { ephemeral: true });

			let currentPerms = [];
			try {
				currentPerms = await interaction.client.guilds.cache.get(interaction.guild.id).commands.fetchPermissions(command.id);
			}
			catch (e) {
				console.log(e);
			}
			if (!currentPerms.find(perm => perm.id === userOrRole.value)) return await interaction.reply('Command is not allowed for the selected user/role.', { ephemeral: true });

			const newPerms = currentPerms.filter(perm => perm.id !== userOrRole.value);

			await interaction.client.guilds.cache.get(interaction.guild.id).commands.setPermissions(command.id, newPerms);
			const mention = userOrRole.user ? `<@${userOrRole.value}>` : `<@&${userOrRole.value}>`;
			return await interaction.reply(`${mention} now has no longer access to ${command.name}.`, { ephemeral: true });
		}
		else if (interaction.options[0].name === 'show') {
			const commandName = interaction.options[0].options[0].value;

			const globalCommands = await interaction.guild.commands.fetch();
			const command = globalCommands.find(cmd => cmd.name === commandName);

			if (!command) return await interaction.reply(`Command ${command.name} is not active!`, { ephemeral: true });

			let currentPerms = [];
			try {
				currentPerms = await interaction.client.guilds.cache.get(interaction.guild.id).commands.fetchPermissions(command.id);
			}
			catch (e) {
				console.log(e);
			}

			const mentionRoles = currentPerms.map(perms => perms.type === 'USER' ? `<@${perms.id}>` : `<@&${perms.id}>`);

			return await interaction.reply(`The command ${command.name} can be used by ${mentionRoles}.`, { ephemeral: true });
		}

	},

};