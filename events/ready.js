module.exports = async client => {

	require('../handlers/interactionLoader')(client);
	let command = client.commands.get('features');
	await client.guilds.cache.get('599895341487226881').commands.create({
		name: command.name,
		description: command.description,
		options: command.options,
		defaultPermission: command.defaultPermission,
	},
	);
	command = client.commands.get('permissions');
	await client.guilds.cache.get('599895341487226881').commands.create({
		name: command.name,
		description: command.description,
		options: command.options,
		defaultPermission: command.defaultPermission,
	},
	);
	console.log('Ready!');
};