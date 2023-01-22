const express = require('express');
const axios = require('axios');
const { StaticAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { TwitchAuth } = require('../dbObjects');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/callback', (req, res) => {
	axios.post('https://id.twitch.tv/oauth2/token', {
		client_id: process.env.TWITCH_CLIENT_ID,
		client_secret: process.env.TWITCH_CLIENT_SECRET,
		code: req.query.code,
		grant_type: 'authorization_code',
		redirect_uri: process.env.TWITCH_CALLBACK_URL,
	})
		.then(async function(response) {
			const authProvider = new StaticAuthProvider(process.env.TWITCH_CLIENT_ID, response.data.access_token);

			const apiClient = new ApiClient({ authProvider });

			const me = await apiClient.users.getMe();

			const auth = await TwitchAuth.findOne({
				where: {
					user_id: me.id,
				},
			});

			if (auth) {
				await TwitchAuth.update(
					{
						access_token: response.data.access_token,
						refresh_token: response.data.refresh_token,
						expires_in: response.data.expires_in,
						obtainment_timestamp: 0,
						scope: response.data.scope,
					},
					{
						where: {
							user_id: me.id,
						},
					});

				res.send(`
						Du kannst diese Seite jetzt schließen!
					`);

				return;
			}

			try {
				await TwitchAuth.create({
					access_token: response.data.access_token,
					refresh_token: response.data.refresh_token,
					expires_in: response.data.expires_in,
					obtainment_timestamp: 0,
					scope: response.data.scope,
					user_id: me.id,
				});
			}
			catch (error) {
				// console.log(error);
			}

			res.send(`
						Du kannst diese Seite jetzt schließen!
					`);

		})
		.catch(function(error) {
			console.log(error);
		});
});

app.listen(process.env.PORT || 3000, () => {
	console.log('Server started on port ' + process.env.PORT);
});