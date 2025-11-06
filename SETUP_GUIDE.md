# Quick Setup Guide

This guide will help you get the Discord bot up and running quickly.

## Prerequisites

- Node.js v16.9.0 or higher
- PostgreSQL database
- Discord bot token
- Twitch application credentials
- Heroku account (for deployment)

## Step 1: Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token (you'll need this later)
5. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
   - Presence Intent

6. Go to "OAuth2" → "URL Generator"
7. Select scopes:
   - `bot`
   - `applications.commands`
8. Select bot permissions:
   - Manage Roles
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
   - Manage Messages
   - Mention Everyone
   - Connect (Voice)
9. Copy the generated URL and use it to invite the bot to your server

## Step 2: Twitch Application Setup

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Click "Register Your Application"
3. Fill in the details:
   - Name: Your bot name
   - OAuth Redirect URLs: `http://localhost:3000/auth/callback` (for development)
   - Category: Chat Bot
4. Click "Create"
5. Copy the Client ID and Client Secret

## Step 3: Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd workspace
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the root directory:
```bash
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# Twitch Configuration
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
TWITCH_CALLBACK_URL=http://localhost:3000/auth/callback
SCOPE=channel:read:redemptions+bits:read+channel:read:subscriptions

# Database (local PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/discord_bot

# Environment
NODE_ENV=development
APP_NAME=your-app-name
```

4. Initialize the database:
```bash
node dbInit.js
```

5. Deploy slash commands to your test server:
```bash
node deploy-commands.js YOUR_GUILD_ID
```

6. Start the bot:
```bash
npm run startBot
```

## Step 4: Configure Bot Settings in Database

You'll need to manually update the Settings table with your configuration:

```sql
-- Replace with your actual IDs
UPDATE config 
SET 
  reward_channel_id = 'YOUR_DISCORD_CHANNEL_ID',
  reward_id = 'YOUR_TWITCH_REWARD_ID',
  live_channel_id = 'YOUR_LIVE_NOTIFICATION_CHANNEL_ID',
  twitch_id = 'YOUR_TWITCH_USER_ID',
  cron_active = true
WHERE guild_id = 'YOUR_GUILD_ID';
```

Or use a database client like pgAdmin or DBeaver.

## Step 5: Set Up Voice Role Links

1. Join a voice channel you want to link
2. Use the command: `/voicelink add role:@RoleName`
3. Users who join this voice channel will automatically get the role

## Step 6: Test Twitch Integration

1. Have a user run `/twitch-connect`
2. Click the button and authorize the application
3. Test channel point redemptions, bits, and sub gifts
4. Verify events are being recorded in the database

## Step 7: Production Deployment to Heroku

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create your-app-name
```

4. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:standard-0
```

5. Set environment variables:
```bash
heroku config:set DISCORD_TOKEN=your_token
heroku config:set DISCORD_CLIENT_ID=your_client_id
heroku config:set TWITCH_CLIENT_ID=your_twitch_id
heroku config:set TWITCH_CLIENT_SECRET=your_twitch_secret
heroku config:set TWITCH_CALLBACK_URL=https://your-app-name.herokuapp.com/auth/callback
heroku config:set SCOPE=channel:read:redemptions+bits:read+channel:read:subscriptions
heroku config:set NODE_ENV=production
heroku config:set APP_NAME=your-app-name
```

6. Update Twitch redirect URL to production URL

7. Deploy to Heroku:
```bash
git push heroku main
```

8. Initialize production database:
```bash
heroku run node dbInit.js
```

9. Deploy commands to production servers:
```bash
heroku run node deploy-commands.js YOUR_GUILD_ID
```

10. Check logs to ensure everything is running:
```bash
heroku logs --tail
```

## Step 8: Verify Everything Works

### Test Checklist:
- [ ] Bot is online in Discord
- [ ] `/help` command works
- [ ] `/voicelink add` works and roles are assigned when joining voice
- [ ] `/twitch-connect` provides OAuth link
- [ ] Stream online notifications work
- [ ] Channel point redemptions are tracked
- [ ] Bits and gifts are recorded
- [ ] Monthly lottery messages are created

## Common Issues and Solutions

### Bot doesn't respond to commands
- **Solution**: Make sure commands are deployed with `node deploy-commands.js GUILD_ID`
- **Solution**: Check bot has "Use Application Commands" permission
- **Solution**: Wait a few minutes for Discord to update command cache

### Database connection fails
- **Solution**: Verify DATABASE_URL is correct
- **Solution**: Check PostgreSQL is running
- **Solution**: Ensure database exists

### Twitch EventSub not receiving events
- **Solution**: In development, ensure ngrok is running
- **Solution**: In production, verify APP_NAME matches Heroku app name
- **Solution**: Check webhook secret matches in code ('hyperSecretWord')

### Voice role links not working
- **Solution**: Ensure bot's role is higher than the role being assigned
- **Solution**: Verify bot has "Manage Roles" permission
- **Solution**: Check voice link is properly saved in database

### OAuth flow not working
- **Solution**: Verify redirect URL matches in Twitch app settings
- **Solution**: Ensure OAuth server is running (not included in this codebase)
- **Solution**: Check TWITCH_CALLBACK_URL environment variable

## Getting Help

- Review the [full API documentation](API_DOCUMENTATION.md)
- Check application logs: `heroku logs --tail`
- Verify database state using a PostgreSQL client
- Test Twitch API connectivity manually

## Next Steps

Once your bot is running:

1. Configure monthly lottery system
2. Set up automatic stream notifications
3. Enable cron jobs for automated tasks
4. Monitor logs for errors
5. Backup database regularly

## Security Reminders

- Never commit `.env` file to version control
- Keep bot token and API secrets secure
- Use different credentials for development and production
- Regularly rotate tokens and passwords
- Enable 2FA on Discord and Twitch accounts
- Review bot permissions regularly

---

**Need more detailed information?** Check out the [complete API documentation](API_DOCUMENTATION.md) for in-depth explanations of all features and functions.
