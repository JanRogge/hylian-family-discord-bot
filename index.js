require('dotenv').config();
const Discord = require('discord.js');
const { Settings, Movie, Genre } = require('./dbObjects');

const client = new Discord.Client(
	{
		presence: {
			activity: { name: 'VSCode', type: 'PLAYING' },
			status: 'online',
		},
	},
);

client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

require('./handlers/commandloader')(client);

client.once('ready', () => {
	console.log('Ready!');
});

client.on('guildCreate', async guild => {
	try {
		await Settings.create({
			guild_id: guild.id,
			prefix: process.env.PREFIX,
		});
	}
	catch (e) {
		console.log(e);
	}
});

client.on('guildDelete', async guild => {
	await Settings.destroy({ where: { guild_id: guild.id } });
	await Movie.destroy({ where: { guild_id: guild.id } });
	await Genre.destroy({ where: { guild_id: guild.id } });
});

client.on('message', async message => {
	let prefix;
	if (message.guild) {
		const settings = await Settings.findOne({
			where: { guild_id: message.guild.id },
		});
		prefix = settings.prefix;
	}
	else {
		prefix = process.env.PREFIX;
	}

	if (!message.content.startsWith(prefix) || message.author.bot) return;

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
});

client.login();
