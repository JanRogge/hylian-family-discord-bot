const { RefreshingAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { TwitchAuth } = require('../dbObjects');

module.exports = {
	async start(client) {
		const authProvider = new RefreshingAuthProvider(
			{
				clientId: process.env.TWITCH_CLIENT_ID,
				clientSecret: process.env.TWITCH_CLIENT_SECRET,
				onRefresh: async function(userId, newTokenData) {
					console.log(newTokenData);
					await TwitchAuth.update({
						access_token: newTokenData.accessToken,
						expires_in: newTokenData.expiresIn,
						obtainment_timestamp: newTokenData.obtainmentTimestamp,
					}, { where: { user_id: userId } });
				},
				onRefreshFailure: async function(newTokenData) {
					console.log(newTokenData);
					console.log('failed');
				},
			},
		);
		const apiClient = new ApiClient({ authProvider });

		client.apiClient = apiClient;
		client.authProvider = authProvider;
	},

	async addUser(client, userId) {
		const tokens = await TwitchAuth.findOne({ where: { user_id: userId } });

		if (!tokens) {
			return;
		}

		await client.authProvider.addUserForToken({
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiresIn: tokens.expires_in,
			obtainmentTimestamp: tokens.obtainment_timestamp,
			scope: tokens.scope,
		});
		const apiClient = new ApiClient({ authProvider: client.authProvider });

		client.apiClient = apiClient;
	},
};