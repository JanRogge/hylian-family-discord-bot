module.exports = async client => {

	require('../handlers/interactionLoader')(client);
	const command = client.commands.get('features');
	await client.guilds.cache.get('599895341487226881').commands.create({
		name: command.name,
		description: command.description,
		options: command.options,
		defaultPermission: command.defaultPermission,
	},
	);
	console.log('Ready!');
};