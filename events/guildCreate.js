const { Settings } = require('../dbObjects');

module.exports = async (client, guild) => {
	try {
		await Settings.create({
			guild_id: guild.id,
			prefix: process.env.PREFIX,
		});
		const command = client.commands.get('features');
		await guild.commands.create([
			{
				name: command.name,
				description: command.description,
				options: command.options,
				defaultPermission: command.defaultPermission,
			},
		]);
	}
	catch (e) {
		console.log(e);
	}
};