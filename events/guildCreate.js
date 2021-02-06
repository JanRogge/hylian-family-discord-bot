const { Settings } = require('../dbObjects');

module.exports = async (client, guild) => {
	try {
		await Settings.create({
			guild_id: guild.id,
			prefix: process.env.PREFIX,
		});
	}
	catch (e) {
		console.log(e);
	}
};