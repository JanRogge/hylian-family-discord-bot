const { Settings } = require('../dbObjects');
const { messageHandling } = require('../components/codeSharing');

module.exports = {
	name: 'messageCreate',
	async execute(message) {
		// Load Settings if in a guild
		let settings;
		if (message.guild) {
			settings = await Settings.findOne({
				where: { guild_id: message.guild.id },
			});
		}

		// Ignore Bot Messages
		if (message.author.bot) return;

		// Handel code Sharing for codes Channel
		messageHandling(message, settings);
	}
};