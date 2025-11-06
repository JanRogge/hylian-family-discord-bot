# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Discord bot.

## Table of Contents
- [Bot Connection Issues](#bot-connection-issues)
- [Command Issues](#command-issues)
- [Database Issues](#database-issues)
- [Twitch Integration Issues](#twitch-integration-issues)
- [Voice Role Link Issues](#voice-role-link-issues)
- [Cron Job Issues](#cron-job-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)

---

## Bot Connection Issues

### Bot Shows as Offline

**Symptoms**:
- Bot not appearing online in Discord
- No response to any commands

**Diagnosis**:
```bash
# Check if bot is running
heroku ps  # For Heroku
# or
ps aux | grep node  # For local

# Check logs
heroku logs --tail
```

**Solutions**:

1. **Invalid Token**:
```bash
# Verify token is set
heroku config:get DISCORD_TOKEN

# Regenerate token if needed:
# - Go to Discord Developer Portal
# - Bot → Reset Token
# - Update environment variable
heroku config:set DISCORD_TOKEN=new_token
```

2. **Bot Process Crashed**:
```bash
# Restart bot
heroku restart

# Check for errors in logs
heroku logs --tail
```

3. **Network/Firewall Issues**:
- Check if outbound HTTPS (443) is allowed
- Verify DNS resolution works
- Test connectivity: `curl https://discord.com/api/v10`

---

### Bot Connects but Immediately Disconnects

**Symptoms**:
- Bot appears online briefly then goes offline
- Logs show connection errors

**Common Causes**:

1. **Invalid Gateway Intents**:
```javascript
// Verify intents in index.js match your bot's privileged intents
// Go to Discord Developer Portal → Bot → Privileged Gateway Intents
intents: [
    GatewayIntentBits.Guilds,          // Required
    GatewayIntentBits.GuildMembers,    // Needs privilege
    GatewayIntentBits.GuildVoiceStates // Required for voice
]
```

2. **Database Connection Failing**:
```bash
# Test database connection
heroku pg:info

# Check if models can connect
heroku run node -e "require('./dbObjects.js')"
```

**Solution**: Enable required privileged intents in Discord Developer Portal

---

## Command Issues

### Commands Don't Appear in Discord

**Symptoms**:
- Typing `/` shows no bot commands
- Commands appear in some servers but not others

**Diagnosis**:
```bash
# Check if commands are registered
heroku run node deploy-commands.js YOUR_GUILD_ID
```

**Solutions**:

1. **Commands Not Deployed**:
```bash
# Deploy to specific guild
node deploy-commands.js GUILD_ID

# For multiple guilds, run for each one
```

2. **Bot Missing Application Commands Scope**:
- Reinvite bot with `applications.commands` scope
- Generate new invite URL from Discord Developer Portal
- OAuth2 → URL Generator → Select `bot` + `applications.commands`

3. **Discord Cache**:
- Wait 1-5 minutes for Discord cache to update
- Restart Discord client
- Try in incognito/private browser window

---

### Commands Appear but Don't Respond

**Symptoms**:
- Commands show up in autocomplete
- No response when executed
- Or "Application did not respond" error

**Diagnosis**:
```bash
# Check logs for errors
heroku logs --tail --source app

# Test a simple command
/help
```

**Solutions**:

1. **Command Handler Not Loaded**:
```javascript
// Verify in index.js
require('./handlers/commandLoader')(client);
require('./handlers/events')(client);
```

2. **Event Handler Not Registered**:
```javascript
// Check events/interactionCreate.js exists and is loaded
```

3. **Async Timing Issue**:
- Discord requires response within 3 seconds
- Use `interaction.deferReply()` for slow operations:
```javascript
async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    // ... slow operation ...
    await interaction.editReply('Done!');
}
```

4. **Permission Issues**:
- Bot needs "Use Application Commands" permission in channel
- Check channel permission overrides

---

### Autocomplete Not Working

**Symptoms**:
- Command works but autocomplete shows no suggestions
- Autocomplete shows error

**Diagnosis**:
```javascript
// Add logging to autocomplete function
async autocomplete(interaction) {
    console.log('Autocomplete triggered:', interaction.options.getFocused(true));
    // ... rest of code
}
```

**Solutions**:

1. **Database Empty**:
```bash
# Check if data exists
heroku pg:psql
SELECT * FROM messages LIMIT 5;
SELECT * FROM config;
```

2. **Query Error**:
- Check logs for SQL errors
- Verify Sequelize queries are correct
- Test queries in isolation

3. **Respond Not Called**:
```javascript
// Always call respond, even with empty array
await interaction.respond([]);
```

---

## Database Issues

### Connection Timeouts

**Symptoms**:
- "Connection timeout" errors in logs
- Commands that access database fail

**Diagnosis**:
```bash
# Check database status
heroku pg:info

# Check connection pool
heroku pg:ps
```

**Solutions**:

1. **Connection Pool Exhausted**:
```javascript
// Increase pool size in dbObjects.js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    pool: {
        max: 10,  // Increase if needed
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
```

2. **SSL Certificate Issues**:
```javascript
// Ensure SSL is configured for production
dialectOptions: {
    ssl: {
        rejectUnauthorized: false
    }
}
```

3. **Database Plan Limits**:
- Check connection limit: `heroku pg:info`
- Upgrade plan if hitting limits
- Close idle connections

---

### Schema Sync Issues

**Symptoms**:
- "Column does not exist" errors
- "Table does not exist" errors

**Diagnosis**:
```bash
# Check current schema
heroku pg:psql
\dt  # List tables
\d table_name  # Describe table
```

**Solutions**:

1. **Database Not Initialized**:
```bash
heroku run node dbInit.js
```

2. **Schema Out of Sync**:
```bash
# Alter schema to match models (safe, doesn't delete data)
heroku run node dbInit.js --alter

# Nuclear option (DELETES ALL DATA)
heroku run node dbInit.js --force
```

3. **Model Definition Error**:
- Check model files in `/models/`
- Verify DataTypes are correct
- Ensure all required fields are defined

---

### Data Integrity Issues

**Symptoms**:
- Duplicate entries
- Orphaned records
- Inconsistent data

**Diagnosis**:
```sql
-- Check for duplicates
SELECT user_id, COUNT(*) 
FROM rewards 
WHERE EXTRACT(MONTH FROM "createdAt") = 1 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Check for orphaned settings
SELECT * FROM config WHERE guild_id NOT IN (
    SELECT DISTINCT guild_id FROM vcrolelinks
);
```

**Solutions**:

1. **Add Validation**:
```javascript
// In redemptionSubscription.js
const existing = await Rewards.findOne({
    where: { user_id, /* date conditions */ }
});
if (existing) {
    // Prevent duplicate
    return;
}
```

2. **Add Database Constraints**:
```sql
-- Add unique constraint
ALTER TABLE rewards 
ADD CONSTRAINT unique_user_month 
UNIQUE (user_id, broadcaster_id, DATE_TRUNC('month', "createdAt"));
```

3. **Cleanup Script**:
```javascript
// Remove duplicates
const duplicates = await Rewards.findAll({
    attributes: ['user_id'],
    group: ['user_id'],
    having: Sequelize.literal('COUNT(*) > 1')
});
// ... delete logic
```

---

## Twitch Integration Issues

### EventSub Webhooks Not Received

**Symptoms**:
- No events recorded in database
- Stream online notifications not sent
- Redemptions not tracked

**Diagnosis**:
```bash
# Check if EventSub listener started
heroku logs --tail | grep "EventSub"

# Check active subscriptions (use Twitch CLI)
twitch api get eventsub/subscriptions -t app
```

**Solutions**:

1. **Development: Ngrok Not Running**:
```bash
# Ensure ngrok is running
ngrok http 3000

# Or use Twitch CLI
twitch event websocket start
```

2. **Production: Wrong Hostname**:
```bash
# Verify APP_NAME matches Heroku app
heroku config:get APP_NAME

# Should match: https://APP_NAME.herokuapp.com
```

3. **Webhook Secret Mismatch**:
```javascript
// In eventSubListener.js
const listener = new EventSubHttpListener({
    secret: 'hyperSecretWord',  // Must match Twitch subscription
    // ...
});
```

4. **Firewall/Port Issues**:
- Heroku: Uses $PORT automatically (no config needed)
- Local: Ensure port 3000 is accessible
- Check firewall rules

5. **Subscription Not Created**:
```bash
# Check logs for subscription creation
heroku logs | grep "subscription"

# Manually verify subscriptions exist
# Use Twitch API or CLI
```

---

### OAuth Flow Fails

**Symptoms**:
- Users can't connect Twitch account
- Redirect fails after authorization
- Token not saved to database

**Diagnosis**:
```bash
# Verify OAuth callback URL
heroku config:get TWITCH_CALLBACK_URL

# Check if it matches Twitch app settings
# Go to: https://dev.twitch.tv/console
```

**Solutions**:

1. **Callback URL Mismatch**:
```bash
# Must match exactly in:
# 1. Twitch app settings
# 2. TWITCH_CALLBACK_URL env var
# 3. OAuth URL in twitchlink.js

# Update env var
heroku config:set TWITCH_CALLBACK_URL=https://your-app.herokuapp.com/auth/callback
```

2. **OAuth Server Not Running**:
- This bot doesn't include the OAuth callback server
- You need a separate Express server to handle callbacks
- Example server structure:
```javascript
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    // Exchange code for tokens
    // Save to TwitchAuth table
    // Trigger authSubscriber.add()
});
```

3. **Invalid Client Secret**:
```bash
# Verify client secret
heroku config:get TWITCH_CLIENT_SECRET

# Regenerate if needed from Twitch console
```

---

### Token Refresh Failures

**Symptoms**:
- "Invalid OAuth token" errors
- API calls fail after working initially
- User subscriptions stop working

**Diagnosis**:
```bash
# Check logs for refresh errors
heroku logs | grep "Token refresh failed"

# Check token expiry
heroku pg:psql
SELECT user_id, expires_in, obtainment_timestamp FROM twitch_auth;
```

**Solutions**:

1. **Refresh Token Invalid**:
- User may have revoked authorization
- Have user re-authorize via `/twitch-connect`

2. **onRefresh Not Saving**:
```javascript
// Verify in twitchApiClient.js
onRefresh: async function(userId, newTokenData) {
    console.log('Refreshing token for', userId);
    await TwitchAuth.update({
        access_token: newTokenData.accessToken,
        expires_in: newTokenData.expiresIn,
        obtainment_timestamp: newTokenData.obtainmentTimestamp
    }, { where: { user_id: userId } });
}
```

3. **Client Secret Wrong**:
```bash
# Verify matches Twitch console
heroku config:get TWITCH_CLIENT_SECRET
```

---

### API Rate Limiting

**Symptoms**:
- "Too Many Requests" errors
- Some API calls fail intermittently
- Bits leaderboard returns empty

**Diagnosis**:
```bash
# Check logs for 429 errors
heroku logs | grep "429"

# Monitor API call frequency
# Add logging to track requests
```

**Solutions**:

1. **Implement Rate Limiting**:
```javascript
// Add delay between API calls
async function rateLimitedCall(fn) {
    await sleep(100); // 100ms between calls
    return await fn();
}
```

2. **Batch Requests**:
```javascript
// Instead of individual calls
const users = await apiClient.users.getUsersByIds(userIds);

// Not
for (const id of userIds) {
    const user = await apiClient.users.getUserById(id);
}
```

3. **Cache Results**:
```javascript
// Cache user info for 5 minutes
const userCache = new Map();
async function getCachedUser(userId) {
    if (userCache.has(userId)) {
        return userCache.get(userId);
    }
    const user = await apiClient.users.getUserById(userId);
    userCache.set(userId, user);
    setTimeout(() => userCache.delete(userId), 5 * 60 * 1000);
    return user;
}
```

---

## Voice Role Link Issues

### Roles Not Assigned When Joining Voice

**Symptoms**:
- Users join voice channel but don't get role
- No errors in logs

**Diagnosis**:
```bash
# Check if voice links exist
heroku pg:psql
SELECT * FROM vcrolelinks WHERE guild_id = 'GUILD_ID';

# Check logs for voice events
heroku logs | grep "voiceStateUpdate"
```

**Solutions**:

1. **Voice Link Not Created**:
```bash
# Verify link exists
SELECT * FROM vcrolelinks WHERE voice_channel_id = 'CHANNEL_ID';

# Create if missing
/voicelink add role:@RoleName
```

2. **Bot Role Too Low**:
- Bot's role must be higher than role being assigned
- Move bot role up in Server Settings → Roles
- Check role hierarchy

3. **Bot Missing Permissions**:
- Needs "Manage Roles" permission
- Check both server-level and channel-level permissions

4. **Role ID Parsing Error**:
```javascript
// Check role_ids format in database
SELECT role_ids FROM vcrolelinks;

// Should be comma-separated IDs
// Example: "123456789,987654321"
```

---

### Roles Not Removed When Leaving Voice

**Symptoms**:
- Role assigned correctly
- Role not removed when user leaves

**Diagnosis**:
```javascript
// Add logging to voiceStateUpdate.js
console.log('Old channel:', oldState.channelId);
console.log('New channel:', newState.channelId);
console.log('Roles to remove:', voiceRolesRemove);
```

**Solutions**:

1. **Channel ID Null Check**:
```javascript
// Verify oldState.channelId is not null
if (!oldState.channelId) {
    // User just joined Discord (not from another channel)
    return;
}
```

2. **Role Removal Permissions**:
- Bot must have permission to remove roles
- Check if role is above bot's role

3. **User Left Server**:
- Can't remove roles from users who left
- Add check: `if (!newState.guild) return;`

---

## Cron Job Issues

### Monthly Lottery Not Created Automatically

**Symptoms**:
- First of month passes, no new message created
- Previous month not finalized

**Diagnosis**:
```bash
# Check if cron is running
heroku logs | grep "cron"

# Check cron_active setting
heroku pg:psql
SELECT guild_id, cron_active FROM config;
```

**Solutions**:

1. **Cron Not Active**:
```sql
-- Enable cron for guild
UPDATE config SET cron_active = true WHERE guild_id = 'GUILD_ID';
```

2. **Timezone Issues**:
```javascript
// Verify timezone in cron.js
cron.schedule('0 4 1 * *', async function() {
    // ...
}, {
    timezone: 'Europe/Berlin'  // Correct for your location
});
```

3. **Bot Restarted During Execution**:
- Heroku dyno restarts can interrupt cron
- Add idempotency checks
- Consider external scheduler (e.g., Heroku Scheduler addon)

4. **Channel Not Found**:
```javascript
// Add error handling
try {
    const channel = await client.channels.fetch(settings.reward_channel_id);
} catch (error) {
    console.error('Channel not found:', settings.reward_channel_id);
    return;
}
```

---

### Keep-Alive Ping Failing

**Symptoms**:
- Logs show ping errors
- Dyno sleeps on Heroku free tier

**Solutions**:

1. **Incorrect APP_NAME**:
```bash
heroku config:get APP_NAME
# Should match your Heroku app name exactly
```

2. **Not Needed on Paid Tier**:
- Remove ping if using Hobby or Standard dynos
- Comment out in cron.js:
```javascript
// cron.schedule('0,10,20,30,40,50 * * * *', ...);
```

3. **SSL/HTTPS Error**:
- Verify URL uses https://
- Check SSL certificate is valid

---

## Deployment Issues

### Heroku Build Fails

**Symptoms**:
- `git push heroku main` fails
- Build log shows errors

**Common Causes**:

1. **Node Version Mismatch**:
```json
// Add to package.json
"engines": {
    "node": "16.x",
    "npm": "8.x"
}
```

2. **Missing Dependencies**:
```bash
# Ensure all deps are in package.json
npm install --save missing-package
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push heroku main
```

3. **Syntax Errors**:
```bash
# Test locally first
npm run startBot

# Check for errors
eslint .
```

---

### Heroku App Crashes on Start

**Symptoms**:
- App deploys but immediately crashes
- `heroku ps` shows crashed state

**Diagnosis**:
```bash
# Check crash reason
heroku logs --tail

# Common errors:
# - Database connection failure
# - Missing environment variables
# - Port binding issues (not applicable for Discord bots)
```

**Solutions**:

1. **Missing Environment Variables**:
```bash
# List current vars
heroku config

# Add missing vars
heroku config:set VAR_NAME=value
```

2. **Database Not Created**:
```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Initialize database
heroku run node dbInit.js
```

3. **Wrong Procfile**:
```
# Procfile should contain:
worker: node index.js

# NOT:
web: node index.js
```

---

## Performance Issues

### Slow Command Responses

**Symptoms**:
- Commands take >3 seconds to respond
- Timeout errors

**Diagnosis**:
```javascript
// Add timing logs
const start = Date.now();
await someSlowOperation();
console.log(`Operation took ${Date.now() - start}ms`);
```

**Solutions**:

1. **Use Deferred Reply**:
```javascript
async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    // Slow operation
    const data = await fetchLargeDataset();
    
    await interaction.editReply(`Result: ${data}`);
}
```

2. **Optimize Database Queries**:
```javascript
// Bad: N+1 queries
for (const redemption of redemptions) {
    const user = await Users.findOne({ where: { id: redemption.user_id } });
}

// Good: Single query
const userIds = redemptions.map(r => r.user_id);
const users = await Users.findAll({ where: { id: userIds } });
```

3. **Add Indexes**:
```sql
CREATE INDEX idx_rewards_date ON rewards(broadcaster_id, "createdAt");
```

---

### High Memory Usage

**Symptoms**:
- Heroku R14 errors (memory quota exceeded)
- Dyno crashes intermittently

**Diagnosis**:
```bash
# Check memory usage
heroku ps -a your-app-name
```

**Solutions**:

1. **Clear Collections Periodically**:
```javascript
// In a cron job or interval
setInterval(() => {
    // Clear old cache entries
    for (const [key, value] of cache.entries()) {
        if (value.timestamp < Date.now() - 3600000) {
            cache.delete(key);
        }
    }
}, 600000); // Every 10 minutes
```

2. **Upgrade Dyno**:
```bash
heroku ps:type hobby
# Or
heroku ps:type standard-1x
```

3. **Profile Memory**:
```javascript
// Add to index.js
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const used = process.memoryUsage();
        console.log('Memory:', {
            rss: Math.round(used.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
        });
    }, 60000);
}
```

---

## Getting More Help

If issues persist after trying these solutions:

1. **Check Logs Thoroughly**:
```bash
heroku logs --tail --source app
```

2. **Enable Debug Mode**:
```bash
heroku config:set NODE_ENV=development
# More verbose logging
```

3. **Review Documentation**:
- [API Documentation](API_DOCUMENTATION.md)
- [Setup Guide](SETUP_GUIDE.md)
- [Architecture](ARCHITECTURE.md)

4. **Test Components Individually**:
```bash
# Test database connection
heroku run node -e "require('./dbObjects')"

# Test single command
heroku run node -e "require('./commands/help')"
```

5. **Check Service Status**:
- Discord Status: https://discordstatus.com/
- Twitch Status: https://status.twitch.tv/
- Heroku Status: https://status.heroku.com/

6. **Community Resources**:
- Discord.js Guide: https://discordjs.guide/
- Twurple Docs: https://twurple.js.org/
- Sequelize Docs: https://sequelize.org/

---

## Reporting Bugs

When reporting issues, include:

1. **Environment Information**:
   - Node.js version: `node --version`
   - Bot version/commit hash
   - Deployment platform (Heroku, local, etc.)

2. **Steps to Reproduce**:
   - Exact commands/actions taken
   - Expected behavior
   - Actual behavior

3. **Logs**:
```bash
# Get logs
heroku logs --tail > logs.txt

# Include relevant portions (remove sensitive data first)
```

4. **Configuration** (sanitized):
   - Environment variables (values hidden)
   - Database schema version
   - Number of guilds

5. **Error Messages**:
   - Full error text
   - Stack traces
   - Error codes

---

*Last Updated: 2024-01-15*
