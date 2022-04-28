const { VoiceRoleLink } = require('../dbObjects');

module.exports = {
	name: 'voiceStateUpdate',
	async execute(oldState, newState) {
		if (oldState.channelId === newState.channelId) return;

		if (newState.guild) {
			const voiceRolesAdd = await VoiceRoleLink.findOne({ where: { guild_id: newState.guild.id, voice_channel_id: newState.channelId } });
			const voiceRolesRemove = await VoiceRoleLink.findOne({ where: { guild_id: oldState.guild.id, voice_channel_id: oldState.channelId } });

			const memberRoles = newState.member.roles;

			if (!voiceRolesAdd && !voiceRolesRemove) return;

			if (voiceRolesRemove) {
				const voiceRoleRemoveString = voiceRolesRemove.role_ids;
				const voiceRoleRemoveArray = voiceRoleRemoveString.split(',');
				const voiceRolesR = [];
				voiceRoleRemoveArray.forEach(roleID => {
					voiceRolesR.push(newState.guild.roles.cache.find(role => role.id === roleID));
				});

				await memberRoles.remove(voiceRolesR);
			}

			if (voiceRolesAdd) {
				const voiceRoleAddString = voiceRolesAdd.role_ids;
				const voiceRoleAddArray = voiceRoleAddString.split(',');
				const voiceRolesA = [];
				voiceRoleAddArray.forEach(roleID => {
					voiceRolesA.push(newState.guild.roles.cache.find(role => role.id === roleID));
				});

				await memberRoles.add(voiceRolesA);
			}

		}
	}
};