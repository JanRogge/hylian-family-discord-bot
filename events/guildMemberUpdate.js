const { Settings } = require('../dbObjects');
const { roleHandling } = require('../components/codeSharing');

module.exports = {
	name: 'guildMemberUpdate',
	async execute(oldState, newState) {
		if(newState.guild) {
			const settings = await Settings.findOne({
				where: { guild_id: newState.guild.id },
			});
	
			// Handle sending new role members the last message of the code channel
			// TODO Fix Gamecode
			// roleHandling(oldState, newState, settings);
		}
	}
};