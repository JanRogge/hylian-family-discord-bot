module.exports = async (client, oldState, newState) => {
	const addedRoles = newState.roles.cache.filter(role => !oldState.roles.cache.has(role.id));

	if (addedRoles.some(role => role.id === '807568520996454431')) {
		const channel = newState.guild.channels.resolve('791703686912016405');
		const messages = await channel.messages.fetch({ limit: 1 });

		newState.send(messages.first().content);

	}
};