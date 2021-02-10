const { VoiceRoleLink } = require('../dbObjects');
const { Settings } = require('../dbObjects');

module.exports = async (client, oldState, newState) => {
	if (oldState.channelID === newState.channelID) return;

	if (newState.guild) {
		const settings = await Settings.findOne({
			where: { guild_id: newState.guild.id },
		});

		if (newState.channelID === settings.live_role_id) {
			const codeChannel = newState.guild.channels.resolve(settings.code_channel_id);
			const messages = await codeChannel.messages.fetch({ limit: 1 });

			let messageContent = messages.first().content;
			if (messages.first().activity) {
				messageContent = messages.first().activity.partyID;
			}

			// Dont send author his message via DM
			if (newState.id === messages.first().author.id) return;

			// Done send blacklisted roles the message via DM
			const blacklistedIds = settings.code_blacklist_roles_id.split(',');
			let blacklisted = false;
			blacklistedIds.forEach(blacklistedId => {
				blacklisted = newState.member.roles.cache.some(role => role.id === blacklistedId);
			});
			if (blacklisted) return;

			newState.member.send(`Der letzte Gamecode/Invitelink vom ${messages.first().createdAt.toLocaleString('de-DE')} ist: ${messageContent}`);
		}

		const voiceRolesAdd = await VoiceRoleLink.findOne({ where: { guild_id: newState.guild.id, voice_channel_id: newState.channelID } });
		const voiceRolesRemove = await VoiceRoleLink.findOne({ where: { guild_id: oldState.guild.id, voice_channel_id: oldState.channelID } });

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
};