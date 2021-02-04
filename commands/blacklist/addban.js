const { User_bans } = require('../../dbObjects');

module.exports = {
	name: 'addban',
	description: 'Ban a user!',
	category: 'blacklist',
	aliases: ['ban'],
	args: true,
	execute: async function(message, args) {

		const discordUser = args[0].substring(1, args[0].length - 1); // User Mention
		const moderator = args[1];
		const reason = args[2];
		const userAlts = args[3];

		// TODO
		// If user warned update else ban

		const affectedRows = await User_bans.update({ type: 'ban' }, { where: { discordId: discordUser } });
		if (affectedRows > 0) {
			return message.reply(`Tag ${discordUser} was edited.`);
		}

		try {
			const user_ban = await User_bans.create({
				discordId: discordUser,
				moderator: moderator,
				reason: reason,
				type: 'ban',
				alts: userAlts,
			});
			return message.reply(`${user_ban.discordId} wurde verwarnt.`);
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return message.reply('Der Nutzer wurde bereits verwarnt');
			}
			return message.reply('Es gabe einen Fehler.');
		}
	},
};