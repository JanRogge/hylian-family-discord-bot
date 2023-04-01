const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('twitch-connect')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Login in with Twitch!')
					.setURL(`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_CALLBACK_URL}&response_type=code&scope=${process.env.SCOPE}`)
					.setStyle(ButtonStyle.Link),
			);
		await interaction.reply({ content: 'Bitte verknüpfe Twitch,', components: [row], ephemeral: true });
	},
};