const cron = require('node-cron');
const axios = require('axios');
const { Settings } = require('../dbObjects');
const { createNewTicketMessage, updateTicketMessage, fetchTicketMessage, fetchData } = require('../components/ticketsMessage');

module.exports = {
	start(client) {
		cron.schedule('22 13 1 * *', async function() {
			const guildSettings = await Settings.findAll({
				where: { cron_active: true },
			});

			for (const settings of guildSettings) {
				const today = new Date();
				let month = today.getMonth();
				let year = today.getFullYear();

				if (month === 0) {
					month = 12;
					year -= 1;
				}

				console.log(month);
				console.log(year);

				const { channel, message } = await fetchTicketMessage(
					client,
					settings.guild_id,
					{
						month,
						year,
					},
				);

				if (message) {
					const { topGifter, topCheerer, redemptionUsers } = await fetchData(client, { month, year }, settings.twitch_id);

					const sortedUserNames = [];
					for (const redemptionUser of redemptionUsers) {
						sortedUserNames.push(redemptionUser.displayName);
					}
					sortedUserNames.sort((a, b) => {
						const nameA = a.toUpperCase();
						const nameB = b.toUpperCase();
						if (nameA < nameB) {
							return -1;
						}
						if (nameA > nameB) {
							return 1;
						}
						return 0;
					});

					let redemptionsString = '';
					for (const sortedUserName of sortedUserNames) {
						redemptionsString += `${sortedUserName}\n`;
					}

					await updateTicketMessage(
						message.message_id,
						channel,
						{
							month,
							year,
						},
						redemptionsString,
						{
							gifter: topGifter,
							cheerer: topCheerer,
						},
					);
				}

				await createNewTicketMessage(channel);
			}
		}, {
			scheduled: true,
			timezone: 'Europe/Berlin',
		});

		cron.schedule('0,10,20,30,40,50 * * * *', async function() {
			const used = process.memoryUsage().heapUsed / 1024 / 1024;
			const rss = process.memoryUsage().rss / 1024 / 1024;
			console.log(`The script uses approximately ${used} MB`);
			console.log(`The script uses approximately ${rss} MB`);
			axios.get(`https://${process.env.APP_NAME}.herokuapp.com/`)
				.then(function() {
					console.log('Ping');
				})
				.catch(function(error) {
					console.log(error);
				});
		});
	},
};
