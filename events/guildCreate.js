const { Settings } = require('../dbObjects');

module.exports = {
	name: 'guildCreate',
	async execute(guild) {
		try {
			await Settings.create({
				guild_id: guild.id,
			});
			let command = guild.client.commands.get('features');
			await guild.commands.create(command.data.toJSON());
			command = guild.client.commands.get('permissions');
			await guild.commands.create(command.data.toJSON());
		}
		catch (e) {
			console.log(e);
		}
	}
};