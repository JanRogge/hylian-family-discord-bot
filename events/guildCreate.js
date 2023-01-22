const { Settings } = require('../dbObjects');

module.exports = {
	name: 'guildCreate',
	async execute(guild) {
		try {
			await Settings.create({
				guild_id: guild.id,
			});
			let command = guild.client.commands.get('help');
			await guild.commands.create(command.data.toJSON());
			command = guild.client.commands.get('twitch-connect');
			await guild.commands.create(command.data.toJSON());
			command = guild.client.commands.get('voicelink');
			await guild.commands.create(command.data.toJSON());
			command = guild.client.commands.get('select-a-winner');
			await guild.commands.create(command.data.toJSON());
		}
		catch (e) {
			console.log(e);
		}
	},
};