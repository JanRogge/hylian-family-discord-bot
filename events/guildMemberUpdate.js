const { Settings } = require('../dbObjects');
const { roleHandling } = require('../components/codeSharing');

module.exports = async (client, oldState, newState) => {
	if(newState.guild) {
		const settings = await Settings.findOne({
			where: { guild_id: newState.guild.id },
		});

		// Handle sending new role members the last message of the code channel
		roleHandling(oldState, newState, settings);
	}
};