const { Settings } = require('../../dbObjects');

module.exports = {
	name: 'prefix',
	description: 'Changes the prefix!',
	category: 'settings',
	permissions: 'ADMINISTRATOR',
	args: false,
	execute: async function(message, args) {
		let prefix = process.env.PREFIX;
		// if there's at least one argument, set the prefix
		if (message.guild) {
			if (args.length) {
				const newPrefix = args[0];

				const affectedRows = await Settings.update({ prefix: newPrefix }, { where: { guild_id: message.guild.id } });
				if (affectedRows > 0) {
					return message.reply(`Prefix is now ${newPrefix}`);
				}
			}
			const settings = await Settings.findOne({
				where: { guild_id: message.guild.id },
			});
			prefix = settings.prefix;
		}

		if (args.length) {
			return message.channel.send('Prefix can\'t be changed in DMs');
		}

		return message.channel.send(`Prefix is \`${prefix}\``);
	},

};