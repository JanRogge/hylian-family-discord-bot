const { RefreshingAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { TwitchAuth } = require('../dbObjects');

module.exports = {
	async start(client, userId) {
		const tokens = await TwitchAuth.findOne({ where: { user_id: userId } });

		if (!tokens) {
			return;
		}

		const authProvider = new RefreshingAuthProvider(
			{
				clientId: process.env.TWITCHCLIENTID,
				clientSecret: process.env.TWITCHCLIENTSECRET,
				onRefresh: async newTokenData => await TwitchAuth.update({
					accessToken: newTokenData.access_token,
					refreshToken: newTokenData.refresh_token,
					expiresIn: newTokenData.expires_in,
					obtainmentTimestamp: newTokenData.obtainment_timestamp,
				}, { where: { user_id: userId } }),
			},
			{
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresIn: tokens.expires_in,
				obtainmentTimestamp: tokens.obtainment_timestamp,
			},
		);
		const apiClient = new ApiClient({ authProvider });

		client.authClients.set(userId, apiClient);
	},
};