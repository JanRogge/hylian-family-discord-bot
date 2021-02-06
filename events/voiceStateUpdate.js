const { VoiceRoleLink } = require('../dbObjects');

module.exports = async (client, oldState, newState) => {
	if (oldState.channelID === newState.channelID) return;

	if (newState.guild) {

		const voiceRolesAdd = await VoiceRoleLink.findOne({ where: { guild_id: newState.guild.id, voice_channel_id: newState.channelID } });
		const voiceRolesRemove = await VoiceRoleLink.findOne({ where: { guild_id: oldState.guild.id, voice_channel_id: oldState.channelID } });

		if (!voiceRolesAdd && !voiceRolesRemove) return;

		if (voiceRolesAdd) {
			const voiceRoleAddString = voiceRolesAdd.role_ids;
			const voiceRoleAddArray = voiceRoleAddString.split(',');
			const voiceRolesA = [];
			voiceRoleAddArray.forEach(roleID => {
				voiceRolesA.push(newState.guild.roles.cache.find(role => role.id === roleID));
			});

			newState.member.roles.add(voiceRolesA);
		}

		if (voiceRolesRemove) {
			const voiceRoleRemoveString = voiceRolesRemove.role_ids;
			const voiceRoleRemoveArray = voiceRoleRemoveString.split(',');
			const voiceRolesR = [];
			voiceRoleRemoveArray.forEach(roleID => {
				voiceRolesR.push(newState.guild.roles.cache.find(role => role.id === roleID));
			});

			newState.member.roles.remove(voiceRolesR);
		}


	}
};