const express = require('express');
const axios = require('axios');
const { StaticAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { TwitchAuth } = require('../dbObjects');

module.exports = () => {
	const app = express();

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.get('/callback', (req, res) => {
		axios.post('https://id.twitch.tv/oauth2/token', {
			client_id: process.env.TWITCHCLIENTID,
			client_secret: process.env.TWITCHCLIENTSECRET,
			code: req.query.code,
			grant_type: 'authorization_code',
			redirect_uri: 'http://localhost:3000/callback',
		})
			.then(async function(response) {
				const authProvider = new StaticAuthProvider(process.env.TWITCHCLIENTID, response.data.access_token);

				const apiClient = new ApiClient({ authProvider });

				const me = await apiClient.users.getMe();

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

	app.listen(3000, () => {
		console.log('Server started on port 3000');
	});
};