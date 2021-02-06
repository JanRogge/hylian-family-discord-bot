const { readdirSync } = require('fs');

module.exports = (client) => {
	const evtFiles = readdirSync('./events/');
	evtFiles.forEach(file => {
		const eventName = file.split('.')[0];
		const event = require(`../events/${file}`);
		// Bind the client to any event, before the existing arguments
		// provided by the discord.js event.
		// This line is awesome by the way. Just sayin'.
		client.on(eventName, event.bind(null, client));
	});
};
