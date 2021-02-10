const { Settings } = require('../dbObjects');
const Discord = require('discord.js');

const cooldowns = new Discord.Collection();

module.exports = async (client, message) => {

	// Load Settings if in a guild
	let settings;
	if (message.guild) {
		settings = await Settings.findOne({
			where: { guild_id: message.guild.id },
		});
	}

	const prefix = settings ? settings.prefix : process.env.PREFIX;

	// Ignore Bot Messages
	if (message.author.bot) return;

	// Handel Code Channel
	if (message.guild && message.channel.id === settings.code_channel_id) {

		let messageContent = message.content;
		if (message.activity) {
			messageContent = message.activity.partyID;
		}

		const membersOfLiveChannel = message.guild.channels.cache.get(settings.live_role_id).members;

		const membersWithOutAuthor = membersOfLiveChannel.filter(member => {
			const blacklistedIds = settings.code_blacklist_roles_id.split(',');
			let blacklisted = false;
			blacklistedIds.forEach(blacklistedId => {
				blacklisted = member.roles.cache.some(role => role.id === blacklistedId);
			});

			return !blacklisted && member.id !== message.author.id ;
		});

		membersWithOutAuthor.forEach(member => {
			member.send(`Der Gamecode/Invitelink ist: ${messageContent}`);
		});
	}

	// Ignore non Commands
	if (!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	if (command.channelWhitelist) {
		if (!command.channelWhitelist.includes(message.channel.id)) {
			return message.reply('Der Befehl ist in diesem Channel nicht erlaubt.');
		}
	}

	if (command.roles) {
		const roles = message.member.roles.cache;
		if (roles.filter(role => command.roles.includes(role.id)).size === 0) {
			return message.reply('Du kannst das nicht!');
		}
	}

	if (command.permissions) {
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			return message.reply('You can not do this!');
		}
	}

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
};