# Discord Bot API Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Configuration](#setup--configuration)
- [Commands API](#commands-api)
- [Components API](#components-api)
- [Events API](#events-api)
- [Database Models](#database-models)
- [Services API](#services-api)
- [Subscriber Modules](#subscriber-modules)
- [Handlers](#handlers)
- [Deployment](#deployment)

---

## Overview

This is a Discord bot designed for the Hylian Family Discord server, featuring Twitch integration for tracking channel points, subscriptions, and giveaways. The bot automatically manages voice channel roles, tracks Twitch events, and manages monthly lottery systems.

### Key Features
- **Voice Channel Role Management**: Automatically assigns roles when users join specific voice channels
- **Twitch Integration**: Tracks bits, subscription gifts, and channel point redemptions
- **Monthly Lottery System**: Manages monthly ticket drawings with automatic winner selection
- **Stream Notifications**: Posts announcements when the streamer goes live
- **OAuth Authentication**: Connects Discord users with Twitch accounts

### Technology Stack
- **Discord.js v14**: Discord API wrapper
- **Twurple**: Twitch API integration
- **Sequelize**: ORM for PostgreSQL
- **Node-cron**: Scheduled tasks
- **Express**: OAuth callback server (referenced in code)

---

## Architecture

### Project Structure
```
/workspace/
├── commands/           # Slash command definitions
├── components/         # Reusable message components
├── events/            # Discord event handlers
├── handlers/          # Module loaders
├── models/            # Database schema definitions
├── services/          # External service integrations
└── subscriber/        # Twitch EventSub subscriptions
```

### Bot Initialization Flow
1. Load environment variables
2. Initialize Discord client with intents
3. Load command handlers
4. Load event handlers
5. Start EventSub listener for Twitch events
6. Start authentication subscriber
7. Start cron jobs
8. Login to Discord

---

## Setup & Configuration

### Environment Variables
```bash
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Twitch Configuration
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_CALLBACK_URL=your_oauth_callback_url
SCOPE=channel:read:redemptions+bits:read+channel:read:subscriptions

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Environment
NODE_ENV=production|development
APP_NAME=your_heroku_app_name
```

### Database Initialization
```bash
# Initialize database with default settings
node dbInit.js

# Force reset database (CAUTION: Deletes all data)
node dbInit.js --force

# Alter existing schema
node dbInit.js --alter
```

### Deploy Commands to Guild
```bash
# Deploy commands to specific guild
node deploy-commands.js <GUILD_ID>
```

### Install Dependencies
```bash
npm install
```

### Start Bot
```bash
npm run startBot
```

---

## Commands API

All commands are Discord slash commands that can be executed in servers where the bot is installed.

### `/help`

**Description**: Shows all available commands or details about a specific command.

**Parameters**:
- `command` (String, Optional): Name of a specific command to get details about

**Usage Examples**:
```
/help
/help voicelink
```

**Response**:
- Without parameter: Lists all available commands
- With parameter: Shows details about the specified command

**Permissions**: Available to all users

**Implementation**:
```javascript
// File: commands/help.js
module.exports = {
    data: SlashCommandBuilder,
    async execute(interaction) { ... }
}
```

---

### `/twitch-connect`

**Description**: Provides OAuth link for users to connect their Twitch account to Discord.

**Parameters**: None

**Usage Example**:
```
/twitch-connect
```

**Response**: 
- Ephemeral message with a button linking to Twitch OAuth
- URL format: `https://id.twitch.tv/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={CALLBACK_URL}&response_type=code&scope={SCOPE}`

**Permissions**: Available to all users

**Implementation**:
```javascript
// File: commands/twitchlink.js
// Creates ActionRowBuilder with ButtonBuilder linking to Twitch OAuth
```

---

### `/voicelink`

**Description**: Create or manage voice channel to role links. When users join the linked voice channel, they automatically receive the specified role(s).

**Subcommands**:

#### `/voicelink add`
**Parameters**:
- `role` (Role, Required): The role to assign when users join the voice channel

**Usage Example**:
```
/voicelink add role:@StreamTeam
```

**Requirements**:
- User must be in the voice channel they want to link
- Bot must have permission to manage roles
- Bot's role must be higher than the role being assigned

**Response**: Confirmation message with channel and role details

#### `/voicelink delete`
**Parameters**:
- `role` (Role, Required): The role to remove from the voice channel link

**Usage Example**:
```
/voicelink delete role:@StreamTeam
```

**Requirements**:
- User must be in the voice channel
- Voice link must exist for the channel

**Response**: Confirmation of deletion or update if multiple roles exist

**Permissions**: Restricted (default permission: false)

**Database Impact**: 
- Creates/updates entries in `VoiceRoleLink` table
- Supports multiple roles per voice channel (comma-separated)

**Implementation Details**:
```javascript
// File: commands/voicelink.js
// Storage format: role_ids as comma-separated string
// Example: "123456789,987654321"
```

---

### `/reload-message`

**Description**: Reload and update a ticket message for a specific month/year with current data from Twitch API.

**Parameters**:
- `monat-jahr` (String, Required, Autocomplete): Month and year in format "Monat Jahr" (e.g., "Januar 2024")

**Usage Example**:
```
/reload-message monat-jahr:Januar 2024
```

**Autocomplete**: Shows list of existing messages from the database

**What it Does**:
1. Fetches top gifter, top cheerer, and all redemption users for the specified month
2. Sorts redemption users alphabetically
3. Updates the Discord message with current information
4. Marks winner if one exists

**Response**: "Nachricht wurde neugeladen!" (Message has been reloaded!)

**Permissions**: Admin only

**API Calls**:
- Database queries to `Messages`, `Gifts`, `Rewards` tables
- Twitch API: bits leaderboard
- Twitch API: user information

**Implementation**:
```javascript
// File: commands/reload-message.js
// Uses fetchData() from ticketsMessage component
```

---

### `/update-bits`

**Description**: Manually override the top cheerer (bits) for a specific month.

**Parameters**:
- `monat-jahr` (String, Required, Autocomplete): Month and year
- `user` (String, Required): Twitch username of the top cheerer

**Usage Example**:
```
/update-bits monat-jahr:Januar 2024 user:username123
```

**Use Case**: 
- When automatic tracking fails
- Manual corrections needed
- Special circumstances or exceptions

**Response**: "Bits wurde geändert!" (Bits have been changed!)

**Permissions**: Admin only

**Database Impact**: Updates message but does not modify Bits table

---

### `/update-gifter`

**Description**: Manually override the top gifter for a specific month.

**Parameters**:
- `monat-jahr` (String, Required, Autocomplete): Month and year
- `user` (String, Required): Twitch username of the top gifter

**Usage Example**:
```
/update-gifter monat-jahr:Januar 2024 user:username123
```

**Use Case**: 
- Manual corrections
- Override automatic calculations
- Special circumstances

**Response**: "Gifter wurde geändert!" (Gifter has been changed!)

**Permissions**: Admin only

**Database Impact**: Updates message but does not modify Gifts table

---

### `/select-a-winner`

**Description**: Select and mark the winner for a monthly lottery drawing.

**Parameters**:
- `monat-jahr` (String, Required, Autocomplete): Month and year
- `user` (String, Required, Autocomplete): Twitch username of the winner

**Usage Example**:
```
/select-a-winner monat-jahr:Januar 2024 user:luckyuser
```

**Autocomplete**:
- First parameter: Shows only messages where `done = false`
- Second parameter: Shows list of users who redeemed tickets that month

**What it Does**:
1. Fetches all redemption users for the month
2. Updates the message with winner marked as "(Winner)"
3. Sets `message.done = true` in database
4. Sets `reward.won = true` for the winner's redemption

**Response**: "Gewinner wurde eingetragen!" (Winner has been entered!)

**Permissions**: Admin only

**Database Impact**: 
- Updates `Messages` table (`done` = true)
- Updates `Rewards` table (`won` = true for winner)

**State Management**: Once a winner is selected, the month is considered "done" and won't appear in future winner selection autocomplete

---

## Components API

Components are reusable modules that provide specific functionality.

### ticketsMessage Component

**File**: `components/ticketsMessage.js`

#### `fetchData(client, date, broadcaster)`

**Description**: Fetches comprehensive lottery data for a specific month.

**Parameters**:
- `client` (Discord.Client): Discord client instance with Twitch API access
- `date` (Object): Date object with `month` (1-12) and `year` properties
- `broadcaster` (String): Twitch user ID of the broadcaster

**Returns**: Promise\<Object\>
```javascript
{
    topGifter: HelixUser,      // Top subscription gifter
    topCheerer: HelixUser,     // Top bits cheerer  
    redemptionUsers: HelixUser[] // All users who redeemed tickets
}
```

**Usage Example**:
```javascript
const { fetchData } = require('./components/ticketsMessage');

const data = await fetchData(client, { month: 1, year: 2024 }, '31547053');
console.log(`Top Gifter: ${data.topGifter.displayName}`);
console.log(`Top Cheerer: ${data.topCheerer.displayName}`);
console.log(`Total Entries: ${data.redemptionUsers.length}`);
```

**Business Logic**:
1. Query database for total gifts per user in the specified month
2. Fetch Twitch bits leaderboard for the month
3. Ensure top gifter and top cheerer are different people
4. Query all channel point redemptions for the month
5. Fetch user details from Twitch API

**Database Queries**:
- `Gifts` table: Aggregated by user_id with SUM(amount)
- `Rewards` table: All redemptions for the month

**API Calls**:
- `apiClient.bits.getLeaderboard()` - Twitch bits leaderboard
- `apiClient.users.getUserById()` - User details
- `apiClient.users.getUsersByIds()` - Batch user details

---

#### `fetchTicketMessage(client, guildId, date)`

**Description**: Retrieves the Discord message and channel for a specific month's lottery.

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `guildId` (String): Discord guild ID
- `date` (Object): Date object with `month` and `year`

**Returns**: Promise\<Object\>
```javascript
{
    channel: TextChannel,   // Discord channel instance
    message: MessageModel   // Database message record
}
```

**Usage Example**:
```javascript
const { channel, message } = await fetchTicketMessage(
    client, 
    '599895341487226881', 
    { month: 1, year: 2024 }
);
```

---

#### `createNewTicketMessage(channel)`

**Description**: Creates a new lottery message for the current month.

**Parameters**:
- `channel` (TextChannel): Discord channel to send the message to

**Returns**: Promise\<void\>

**Message Template**:
```
**Glückslose [Month] [Year]:**

[Redemption List]

**Gewinner:**
Top-Subgifter: 
Top-Cheerer: 
Los-Gewinner:
```

**Usage Example**:
```javascript
const channel = await client.channels.fetch('791703686912016405');
await createNewTicketMessage(channel);
```

**Database Impact**: Creates new entry in `Messages` table with `done = false`

**Called By**: 
- Cron job on first day of month at 4 AM Berlin time
- Manual creation if needed

---

#### `updateTicketMessage(messageToUpdateId, channel, date, redemptions, top)`

**Description**: Updates an existing lottery message with current data.

**Parameters**:
- `messageToUpdateId` (String): Discord message ID to update
- `channel` (TextChannel): Discord channel containing the message
- `date` (Object): Date object with `month` (1-12) and `year`
- `redemptions` (String): Formatted string of redemption usernames
- `top` (Object): Top winners object

**Top Object Structure**:
```javascript
{
    gifter: HelixUser,    // Optional: Top subscription gifter
    cheerer: HelixUser,   // Optional: Top bits cheerer
    winner: HelixUser     // Optional: Lottery winner
}
```

**Returns**: Promise\<void\>

**Usage Example**:
```javascript
await updateTicketMessage(
    '123456789',
    channel,
    { month: 1, year: 2024 },
    "Alice\nBob\n*Charlie (Winner)*\n",
    {
        gifter: { displayName: 'TopGifter' },
        cheerer: { displayName: 'TopCheerer' },
        winner: { displayName: 'Charlie' }
    }
);
```

**Redemptions String Format**:
- One username per line
- Winners marked as: `*Username (Winner)*`
- Alphabetically sorted

---

## Events API

Events are Discord.js event handlers that respond to Discord gateway events.

### ready Event

**File**: `events/ready.js`

**Trigger**: When bot successfully connects to Discord

**Execution**: Once only

**Handler**:
```javascript
module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('Ready!');
    }
}
```

**Usage**: Initialization confirmation, setup tasks

---

### guildCreate Event

**File**: `events/guildCreate.js`

**Trigger**: When bot joins a new Discord server

**What it Does**:
1. Creates default settings entry in database for the guild
2. Registers guild-specific commands:
   - `/help`
   - `/twitch-connect`
   - `/voicelink`
   - `/select-a-winner`

**Handler**:
```javascript
module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        await Settings.create({ guild_id: guild.id });
        // Create guild commands...
    }
}
```

**Database Impact**: Creates entry in `Settings` table

**Error Handling**: Logs errors but doesn't fail

---

### guildDelete Event

**File**: `events/guildDelete.js`

**Trigger**: When bot is removed from a Discord server

**What it Does**:
1. Deletes all guild settings from database
2. Deletes all voice role links for the guild

**Handler**:
```javascript
module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        await Settings.destroy({ where: { guild_id: guild.id } });
        await VoiceRoleLink.destroy({ where: { guild_id: guild.id } });
    }
}
```

**Database Impact**: 
- Removes from `Settings` table
- Removes from `VoiceRoleLink` table

**Cleanup**: Ensures no orphaned data remains

---

### interactionCreate Event

**File**: `events/interactionCreate.js`

**Trigger**: When any user interaction occurs (commands, buttons, autocomplete, etc.)

**Handles**:
1. **Chat Input Commands** (Slash commands)
   - Fetches command from client.commands collection
   - Executes command handler
   - Catches and reports errors

2. **Autocomplete Interactions**
   - Fetches command from client.commands collection
   - Calls command's autocomplete method
   - Provides dynamic option suggestions

**Handler**:
```javascript
module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            await command.execute(interaction);
        }
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            await command.autocomplete(interaction);
        }
    }
}
```

**Error Handling**: 
- Command execution errors: Sends ephemeral error message to user
- Autocomplete errors: Logged to console

---

### voiceStateUpdate Event

**File**: `events/voiceStateUpdate.js`

**Trigger**: When a user's voice state changes (joins, leaves, or moves between voice channels)

**What it Does**:
1. Checks if user changed voice channels
2. Queries database for voice role links
3. Removes roles from old channel (if configured)
4. Adds roles for new channel (if configured)

**Handler Parameters**:
- `oldState` (VoiceState): Previous voice state
- `newState` (VoiceState): Current voice state

**Business Logic**:
```javascript
// Ignore if user just muted/unmuted without changing channels
if (oldState.channelId === newState.channelId) return;

// Query for role links
const voiceRolesAdd = await VoiceRoleLink.findOne({ 
    where: { 
        guild_id: newState.guild.id, 
        voice_channel_id: newState.channelId 
    } 
});

const voiceRolesRemove = await VoiceRoleLink.findOne({ 
    where: { 
        guild_id: oldState.guild.id, 
        voice_channel_id: oldState.channelId 
    } 
});
```

**Role Assignment**:
- Supports multiple roles per channel (comma-separated in database)
- Removes old roles before adding new ones
- Handles permission errors gracefully

**Error Handling**: 
- Catches role assignment errors (e.g., bot role too low)
- Logs German error: "Rolle über der Rolle des Bots" (Role above bot's role)

**Database Query**: `VoiceRoleLink` table

---

## Database Models

All models use Sequelize ORM with PostgreSQL.

### Settings Model

**File**: `models/Settings.js`

**Table Name**: `config`

**Description**: Stores guild-specific configuration settings.

**Schema**:
```javascript
{
    config_id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    guild_id: {
        type: STRING,
        unique: true
    },
    reward_channel_id: STRING,      // Channel for lottery messages
    reward_id: STRING,               // Twitch channel point reward ID
    live_channel_id: STRING,         // Channel for stream notifications
    twitch_id: STRING,               // Broadcaster Twitch user ID
    cron_active: BOOLEAN             // Enable/disable cron jobs for guild
}
```

**Timestamps**: Disabled

**Indexes**: Unique index on `guild_id`

**Usage Example**:
```javascript
const { Settings } = require('./dbObjects');

// Get guild settings
const settings = await Settings.findOne({
    where: { guild_id: '599895341487226881' }
});

// Update settings
await Settings.update(
    { cron_active: true },
    { where: { guild_id: '599895341487226881' } }
);

// Upsert settings
await Settings.upsert({
    guild_id: '599895341487226881',
    reward_channel_id: '791703686912016405',
    twitch_id: '31547053',
    cron_active: false
});
```

---

### VoiceRoleLink Model

**File**: `models/VoiceRoleLink.js`

**Table Name**: `vcrolelink`

**Description**: Maps voice channels to roles that should be assigned when users join.

**Schema**:
```javascript
{
    guild_id: {
        type: STRING,
        unique: 'vcRoleComposite'    // Composite unique key
    },
    voice_channel_id: {
        type: STRING,
        unique: 'vcRoleComposite'    // Composite unique key
    },
    role_ids: STRING                 // Comma-separated role IDs
}
```

**Timestamps**: Disabled

**Unique Constraint**: Composite unique on `(guild_id, voice_channel_id)`

**Data Format**: 
- `role_ids` stores multiple roles as comma-separated string
- Example: `"123456789,987654321,456789123"`

**Usage Example**:
```javascript
const { VoiceRoleLink } = require('./dbObjects');

// Create voice link
await VoiceRoleLink.create({
    guild_id: '599895341487226881',
    voice_channel_id: '123456789',
    role_ids: '987654321'
});

// Add additional role to existing link
const link = await VoiceRoleLink.findOne({
    where: { 
        guild_id: '599895341487226881',
        voice_channel_id: '123456789'
    }
});

const roleString = link.role_ids + ',456789123';
await VoiceRoleLink.update(
    { role_ids: roleString },
    { where: { 
        guild_id: '599895341487226881',
        voice_channel_id: '123456789'
    }}
);

// Delete voice link
await VoiceRoleLink.destroy({
    where: {
        guild_id: '599895341487226881',
        voice_channel_id: '123456789'
    }
});
```

---

### Bits Model

**File**: `models/Bits.js`

**Table Name**: `bits`

**Description**: Tracks bits (cheers) given by users to broadcasters.

**Schema**:
```javascript
{
    user_id: STRING,           // Twitch user ID of cheerer
    amount: INTEGER,           // Number of bits cheered
    broadcaster_id: STRING     // Twitch user ID of broadcaster
}
```

**Timestamps**: Enabled (createdAt, updatedAt)

**Usage Example**:
```javascript
const { Bits } = require('./dbObjects');

// Record bits event
await Bits.create({
    user_id: '123456',
    amount: 500,
    broadcaster_id: '31547053'
});

// Get top cheerer for a month
const topCheerer = await Bits.findOne({
    attributes: [
        'user_id',
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalBits']
    ],
    where: {
        broadcaster_id: '31547053',
        [Op.and]: [
            Sequelize.fn('EXTRACT(MONTH from "createdAt") =', 1),
            Sequelize.fn('EXTRACT(YEAR from "createdAt") =', 2024)
        ]
    },
    order: [['totalBits', 'DESC']],
    group: 'user_id'
});
```

**Data Source**: Twitch EventSub - Channel Cheer events

---

### Gifts Model

**File**: `models/Gifts.js`

**Table Name**: `gifts`

**Description**: Tracks subscription gifts given by users.

**Schema**:
```javascript
{
    user_id: STRING,           // Twitch user ID of gifter
    amount: INTEGER,           // Number of subscriptions gifted
    broadcaster_id: STRING     // Twitch user ID of broadcaster
}
```

**Timestamps**: Enabled (createdAt, updatedAt)

**Usage Example**:
```javascript
const { Gifts } = require('./dbObjects');

// Record gift event
await Gifts.create({
    user_id: '123456',
    amount: 5,
    broadcaster_id: '31547053'
});

// Get top gifter for a month
const topGifter = await Gifts.findOne({
    attributes: [
        'user_id',
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalGifts']
    ],
    where: {
        broadcaster_id: '31547053',
        [Op.and]: [
            Sequelize.fn('EXTRACT(MONTH from "createdAt") =', 1),
            Sequelize.fn('EXTRACT(YEAR from "createdAt") =', 2024)
        ]
    },
    order: [['totalGifts', 'DESC']],
    group: 'user_id'
});
```

**Data Source**: Twitch EventSub - Channel Subscription Gift events

---

### Messages Model

**File**: `models/Messages.js`

**Table Name**: `messages`

**Description**: Tracks Discord messages for monthly lottery drawings.

**Schema**:
```javascript
{
    guild_id: STRING,       // Discord guild ID
    channel_id: STRING,     // Discord channel ID
    message_id: STRING,     // Discord message ID
    name: STRING,           // Display name (e.g., "Januar 2024")
    done: BOOLEAN          // Whether winner has been selected
}
```

**Timestamps**: Enabled (createdAt, updatedAt)

**Usage Example**:
```javascript
const { Messages } = require('./dbObjects');

// Create message record
await Messages.create({
    guild_id: '599895341487226881',
    channel_id: '791703686912016405',
    message_id: '987654321',
    name: 'Januar 2024',
    done: false
});

// Find active (incomplete) messages
const activeMessages = await Messages.findAll({
    where: {
        guild_id: '599895341487226881',
        done: false
    }
});

// Mark as done after winner selection
await Messages.update(
    { done: true },
    { where: { message_id: '987654321' } }
);
```

**Lifecycle**:
1. Created by cron job at start of month (`done: false`)
2. Updated throughout month as redemptions occur
3. Marked `done: true` when winner is selected
4. Historical record persists indefinitely

---

### Rewards Model

**File**: `models/Rewards.js`

**Table Name**: `rewards`

**Description**: Tracks channel point redemptions (lottery tickets).

**Schema**:
```javascript
{
    user_id: STRING,           // Twitch user ID
    broadcaster_id: STRING,    // Twitch user ID of broadcaster
    won: BOOLEAN              // Whether this entry won the lottery
}
```

**Timestamps**: Enabled (createdAt, updatedAt)

**Business Rules**:
- One redemption per user per month (enforced in redemptionSubscription)
- Only one winner per month (one entry with `won: true`)

**Usage Example**:
```javascript
const { Rewards } = require('./dbObjects');

// Record redemption
await Rewards.create({
    user_id: '123456',
    broadcaster_id: '31547053',
    won: false
});

// Check if user already redeemed this month
const existingRedemption = await Rewards.findOne({
    where: {
        user_id: '123456',
        broadcaster_id: '31547053',
        [Op.and]: [
            Sequelize.fn('EXTRACT(MONTH from "createdAt") =', 1),
            Sequelize.fn('EXTRACT(YEAR from "createdAt") =', 2024)
        ]
    }
});

// Mark winner
await Rewards.update(
    { won: true },
    { where: { user_id: '123456', /* date conditions */ } }
);

// Get all entries for a month
const entries = await Rewards.findAll({
    where: {
        broadcaster_id: '31547053',
        [Op.and]: [
            Sequelize.fn('EXTRACT(MONTH from "createdAt") =', 1),
            Sequelize.fn('EXTRACT(YEAR from "createdAt") =', 2024)
        ]
    }
});
```

**Data Source**: Twitch EventSub - Channel Points Custom Reward Redemption

---

### TwitchAuth Model

**File**: `models/TwitchAuth.js`

**Table Name**: `twitch_auth`

**Description**: Stores OAuth tokens for authenticated Twitch users.

**Schema**:
```javascript
{
    access_token: {
        type: STRING,
        unique: true
    },
    refresh_token: {
        type: STRING,
        unique: true
    },
    expires_in: INTEGER,                    // Token expiration in seconds
    obtainment_timestamp: STRING,           // ISO timestamp when token was obtained
    scope: ARRAY(DataTypes.STRING),         // Array of permission scopes
    user_id: {
        type: STRING,
        unique: true
    }
}
```

**Timestamps**: Disabled

**Security Notes**:
- Access tokens are sensitive credentials
- Tokens are automatically refreshed by RefreshingAuthProvider
- Tokens are deleted when user revokes authorization

**Usage Example**:
```javascript
const { TwitchAuth } = require('./dbObjects');

// Store new auth tokens
await TwitchAuth.create({
    access_token: 'abc123...',
    refresh_token: 'xyz789...',
    expires_in: 3600,
    obtainment_timestamp: '2024-01-01T12:00:00.000Z',
    scope: ['channel:read:redemptions', 'bits:read'],
    user_id: '31547053'
});

// Get user tokens
const tokens = await TwitchAuth.findOne({
    where: { user_id: '31547053' }
});

// Update after refresh
await TwitchAuth.update(
    {
        access_token: 'new_token',
        expires_in: 3600,
        obtainment_timestamp: new Date().toISOString()
    },
    { where: { user_id: '31547053' } }
);

// Delete on revocation
await TwitchAuth.destroy({
    where: { user_id: '31547053' }
});
```

**Refresh Flow**: Handled automatically by `RefreshingAuthProvider` in twitchApiClient service

---

## Services API

Services manage external integrations and scheduled tasks.

### eventSubListener Service

**File**: `services/eventSubListener.js`

**Description**: Initializes Twitch EventSub HTTP listener for receiving Twitch events.

#### `start(client)`

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: Promise\<void\>

**What it Does**:
1. Creates AppTokenAuthProvider with client credentials
2. Initializes Twitch API client
3. Sets up HTTP adapter (Ngrok for dev, Heroku for prod)
4. Starts EventSub HTTP listener
5. Attaches listener to Discord client

**Environment-Specific Behavior**:

**Development**:
```javascript
await apiClient.eventSub.deleteAllSubscriptions(); // Clean slate
adapter = new NgrokAdapter(); // Use ngrok tunnel
```

**Production**:
```javascript
adapter = new EnvPortAdapter({
    hostName: `${process.env.APP_NAME}.herokuapp.com`
});
```

**Client Properties Added**:
```javascript
client.listener    // EventSubHttpListener instance
client.subs        // Discord.Collection of subscriptions
client.appClient   // Twitch ApiClient with app auth
```

**Usage Example**:
```javascript
const eventSubListener = require('./services/eventSubListener');
await eventSubListener.start(client);

// Access listener
const listener = client.listener;

// Subscribe to an event
const subscription = await listener.onStreamOnline(userId, async (event) => {
    console.log(`${event.broadcasterName} went live!`);
});
```

**Configuration**:
- Secret: `'hyperSecretWord'` (used to verify webhook signatures)
- Strict Host Check: Enabled
- Legacy Secrets: Enabled

---

### twitchApiClient Service

**File**: `services/twitchApiClient.js`

**Description**: Manages user-authenticated Twitch API client with automatic token refresh.

#### `start(client)`

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: Promise\<void\>

**What it Does**:
1. Creates RefreshingAuthProvider with token refresh callbacks
2. Initializes API client with auth provider
3. Attaches to Discord client

**Client Properties Added**:
```javascript
client.apiClient      // Twitch ApiClient with user auth
client.authProvider   // RefreshingAuthProvider instance
```

**Token Refresh Callback**:
```javascript
onRefresh: async function(userId, newTokenData) {
    await TwitchAuth.update({
        access_token: newTokenData.accessToken,
        expires_in: newTokenData.expiresIn,
        obtainment_timestamp: newTokenData.obtainmentTimestamp
    }, { where: { user_id: userId } });
}
```

**Usage Example**:
```javascript
const twitchApiClient = require('./services/twitchApiClient');

// Initialize
await twitchApiClient.start(client);

// Use API client
const user = await client.apiClient.users.getUserById('31547053');
console.log(user.displayName);
```

---

#### `addUser(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch user ID

**Returns**: Promise\<void\>

**What it Does**:
1. Fetches user's tokens from database
2. Adds tokens to auth provider
3. Creates new API client with user context

**Usage Example**:
```javascript
// After user completes OAuth
await twitchApiClient.addUser(client, '31547053');

// Now API calls will use this user's credentials
const redemptions = await client.apiClient.channelPoints.getRedemptionById(
    userId,
    rewardId,
    redemptionId
);
```

**When Called**:
- During bot startup for existing authenticated users
- When new user completes OAuth flow
- Before setting up user-specific EventSub subscriptions

---

### cron Service

**File**: `services/cron.js`

**Description**: Manages scheduled tasks using node-cron.

#### `start(client)`

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: void

**Scheduled Tasks**:

#### Task 1: Monthly Lottery Finalization
**Schedule**: `'0 4 1 * *'` (4:00 AM on the 1st of every month)
**Timezone**: Europe/Berlin

**What it Does**:
1. Queries all guilds with `cron_active: true`
2. For each guild:
   - Fetches previous month's lottery message
   - Fetches final data (top gifter, top cheerer, all redemptions)
   - Sorts redemption usernames alphabetically
   - Updates previous month's message with final results
   - Creates new lottery message for current month

**Cron Expression Breakdown**:
```
0   4   1   *   *
│   │   │   │   │
│   │   │   │   └── Day of week (any)
│   │   │   └────── Month (any)
│   │   └────────── Day of month (1st)
│   └────────────── Hour (4 AM)
└────────────────── Minute (0)
```

**Usage Example**:
```javascript
const cron = require('./services/cron');
cron.start(client);
```

**Business Logic**:
```javascript
// Calculate previous month
let month = today.getMonth(); // 0-11
let year = today.getFullYear();

if (month === 0) {  // January
    month = 12;     // Use December
    year -= 1;      // Of previous year
}
```

---

#### Task 2: Heroku Keep-Alive Ping
**Schedule**: `'0,10,20,30,40,50 * * * *'` (Every 10 minutes)

**What it Does**:
- Sends HTTP GET request to `https://{APP_NAME}.herokuapp.com/`
- Prevents Heroku free dyno from sleeping
- Logs success/failure

**Cron Expression Breakdown**:
```
0,10,20,30,40,50   *   *   *   *
│                  │   │   │   │
│                  │   │   │   └── Day of week (any)
│                  │   │   └────── Month (any)
│                  │   └────────── Day of month (any)
│                  └────────────── Hour (any)
└──────────────────────────────── Minute (every 10)
```

**Note**: Only needed for Heroku free tier dynos

---

## Subscriber Modules

Subscribers set up and manage Twitch EventSub subscriptions.

### authSubscriber (App Subscription)

**File**: `subscriber/appSubscriptions/authSubscriber.js`

**Description**: Handles user authorization grant events and initializes user subscriptions.

#### `start(client)`

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: Promise\<void\>

**What it Does**:
1. Starts twitchApiClient service
2. Queries all guilds with configured Twitch IDs
3. Adds subscriptions for each broadcaster
4. Sets up listener for new authorization grants

**Event Subscription**: `onUserAuthorizationGrant`
- Triggers when user completes OAuth flow
- Automatically adds all user subscriptions for the user

**Flow Diagram**:
```
User completes OAuth
        ↓
onUserAuthorizationGrant event
        ↓
authSubscriber.add(client, userId)
        ↓
Initialize all user subscriptions:
- cheerSubscription
- giftSubscription  
- onlineSubscription
- redemptionSubscription
```

**Usage Example**:
```javascript
const authSubscriber = require('./subscriber/appSubscriptions/authSubscriber');
await authSubscriber.start(client);
```

---

#### `add(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch user ID

**Returns**: Promise\<void\>

**What it Does**:
1. Adds user to auth provider
2. Creates subscription collection for user
3. Loads all subscription modules from `userSubscriptions/` directory
4. Starts each subscription for the user

**Usage Example**:
```javascript
// Manually add user
await authSubscriber.add(client, '31547053');

// Check subscriptions
const userSubs = client.subs.get('31547053');
console.log(`User has ${userSubs.size} active subscriptions`);
```

**Error Handling**: Logs errors but continues with other subscriptions

---

### unAuthSubscriber (App Subscription)

**File**: `subscriber/appSubscriptions/unAuthSubscriber.js`

**Description**: Handles user authorization revocation events.

#### `start(client)`

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: Promise\<void\>

**Event Subscription**: `onUserAuthorizationRevoke`
- Triggers when user revokes app authorization on Twitch
- Cleans up all subscriptions and tokens

**What it Does**:
1. Fetches user's subscriptions from client.subs
2. Stops all active subscriptions
3. Removes user from subscription collection
4. Removes user from auth provider
5. Deletes tokens from database

**Usage Example**:
```javascript
const unAuthSubscriber = require('./subscriber/appSubscriptions/unAuthSubscriber');
await unAuthSubscriber.start(client);
```

**Cleanup Flow**:
```javascript
// When user revokes authorization:
const data = client.subs.get(userId);

// Stop all subscriptions
for (const sub of data) {
    sub.stop();
}

// Remove from collections
client.subs.delete(userId);
client.authProvider.removeUser(userId);

// Delete from database
await TwitchAuth.destroy({ where: { user_id: userId } });
```

---

### cheerSubscription (User Subscription)

**File**: `subscriber/userSubscriptions/cheerSubscription.js`

**Description**: Tracks bits (cheers) given to the broadcaster.

#### `start(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch broadcaster user ID

**Returns**: Promise\<void\>

**Event**: `onChannelCheer`

**Event Data**:
```javascript
{
    broadcasterName: String,
    broadcasterId: String,
    userId: String,          // Cheerer user ID
    bits: Number,           // Amount of bits
    isAnonymous: Boolean
}
```

**Business Logic**:
- Ignores anonymous cheers
- Records all non-anonymous cheers to database

**Database**: Creates entry in `Bits` table

**Usage Example**:
```javascript
const cheerSubscription = require('./subscriber/userSubscriptions/cheerSubscription');
await cheerSubscription.start(client, '31547053');
```

---

#### `stop(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch broadcaster user ID

**Returns**: Promise\<void\>

**What it Does**:
1. Retrieves subscription from client.subs
2. Calls subscription.stop() to unsubscribe from Twitch
3. Removes from collection

---

### giftSubscription (User Subscription)

**File**: `subscriber/userSubscriptions/giftSubscription.js`

**Description**: Tracks subscription gifts given to the broadcaster's community.

#### `start(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch broadcaster user ID

**Returns**: Promise\<void\>

**Event**: `onChannelSubscriptionGift`

**Event Data**:
```javascript
{
    broadcasterName: String,
    broadcasterId: String,
    gifterId: String,        // User who gifted
    amount: Number,          // Number of subs gifted
    isAnonymous: Boolean
}
```

**Business Logic**:
- Ignores anonymous gifts
- Records all non-anonymous gifts to database

**Database**: Creates entry in `Gifts` table

**Usage Example**:
```javascript
const giftSubscription = require('./subscriber/userSubscriptions/giftSubscription');
await giftSubscription.start(client, '31547053');
```

**Note**: Each gift event represents a batch of subscriptions (e.g., gifting 5 subs is one event with amount=5)

---

### onlineSubscription (User Subscription)

**File**: `subscriber/userSubscriptions/onlineSubscription.js`

**Description**: Detects when broadcaster goes live and posts notification to Discord.

#### `start(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch broadcaster user ID

**Returns**: Promise\<void\>

**Event**: `onStreamOnline`

**What it Does**:
1. Fetches stream details
2. Fetches broadcaster user details
3. Queries guild settings for live notification channel
4. Creates rich embed with stream information
5. Posts announcement with @everyone mention

**Embed Structure**:
```javascript
{
    color: 0x00F7F7,                     // Cyan
    title: stream.title,                 // Stream title
    url: 'https://www.twitch.tv/hylian_tami',
    author: {
        name: user.displayName,
        iconURL: user.profilePictureUrl
    },
    thumbnail: user.profilePictureUrl,
    image: stream.thumbnailUrl
}
```

**Message Template**:
```
Hey @everyone, hylian_tami, ist jetzt live https://twitch.tv/hylian_tami !
Kommt rein, ich freue mich auf euch! :HyHeart:
```

**Usage Example**:
```javascript
const onlineSubscription = require('./subscriber/userSubscriptions/onlineSubscription');
await onlineSubscription.start(client, '31547053');
```

**Configuration Requirements**:
- `Settings.live_channel_id` must be set
- Bot must have permission to send messages and mention @everyone in channel

---

### redemptionSubscription (User Subscription)

**File**: `subscriber/userSubscriptions/redemptionSubscription.js`

**Description**: Tracks channel point reward redemptions (lottery tickets).

#### `start(client, userId)`

**Parameters**:
- `client` (Discord.Client): Discord client instance
- `userId` (String): Twitch broadcaster user ID

**Returns**: Promise\<void\>

**Event**: 
- `onChannelRedemptionAddForReward` (if reward_id configured)
- `onChannelRedemptionAdd` (fallback for all redemptions)

**Complex Business Logic**:

1. **Check for Existing Redemption**:
   - Query database for existing redemption this month
   - If exists: Cancel the redemption and exit

2. **Record Redemption**:
   - Create entry in Rewards table
   - Mark redemption as fulfilled (commented out)

3. **Update Discord Message**:
   - Fetch current month's lottery message
   - Fetch all redemptions for the month
   - Sort usernames alphabetically
   - Update message with current participants

**Event Data**:
```javascript
{
    userId: String,              // User who redeemed
    broadcasterId: String,       // Broadcaster user ID
    rewardId: String,           // Channel point reward ID
    rewardTitle: String,        // Reward display name
    id: String                  // Redemption ID
}
```

**One Redemption Per Month Logic**:
```javascript
const redemption = await Rewards.findOne({
    where: {
        user_id: s.userId,
        broadcaster_id: s.broadcasterId,
        [Op.and]: [
            Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month),
            Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year)
        ]
    }
});

if (redemption) {
    console.log(s.userId + ' hat schon ein Los diesen Monat eingelöst!');
    await rewardRedemption.updateStatus('CANCELED');
    return;
}
```

**Usage Example**:
```javascript
const redemptionSubscription = require('./subscriber/userSubscriptions/redemptionSubscription');
await redemptionSubscription.start(client, '31547053');
```

**Configuration Requirements**:
- `Settings.reward_id` (optional): Specific reward to track
- `Settings.reward_channel_id`: Channel for lottery messages
- Without reward_id: Logs all redemptions for debugging

**API Operations**:
- Fetch redemption: `client.apiClient.channelPoints.getRedemptionById()`
- Cancel redemption: `rewardRedemption.updateStatus('CANCELED')`
- Fulfill redemption: `rewardRedemption.updateStatus('FULFILLED')` (commented)

---

## Handlers

Handlers load and initialize modules dynamically.

### commandLoader Handler

**File**: `handlers/commandLoader.js`

**Description**: Dynamically loads all command modules from the commands directory.

**Function Signature**:
```javascript
module.exports = (client) => { ... }
```

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: void

**What it Does**:
1. Creates `client.commands` collection
2. Reads all .js files from `/commands/` directory
3. Requires each command module
4. Stores commands in collection with command name as key

**Usage Example**:
```javascript
// In index.js
require('./handlers/commandLoader')(client);

// Access commands
const helpCommand = client.commands.get('help');
await helpCommand.execute(interaction);
```

**Command Structure**:
```javascript
module.exports = {
    data: SlashCommandBuilder,  // Command definition
    async execute(interaction) { ... },  // Command handler
    async autocomplete(interaction) { ... }  // Optional autocomplete
}
```

---

### events Handler

**File**: `handlers/events.js`

**Description**: Dynamically loads all event modules from the events directory.

**Function Signature**:
```javascript
module.exports = (client) => { ... }
```

**Parameters**:
- `client` (Discord.Client): Discord client instance

**Returns**: void

**What it Does**:
1. Reads all .js files from `/events/` directory
2. Requires each event module
3. Registers event listeners on Discord client
4. Handles both `once` and recurring events

**Event Registration**:
```javascript
if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
} else {
    client.on(event.name, (...args) => event.execute(...args));
}
```

**Usage Example**:
```javascript
// In index.js
require('./handlers/events')(client);
```

**Event Structure**:
```javascript
module.exports = {
    name: 'eventName',        // Discord.js event name
    once: false,              // Optional: true for one-time events
    async execute(...args) { ... }  // Event handler
}
```

**Supported Events**:
- `ready` (once)
- `guildCreate`
- `guildDelete`
- `interactionCreate`
- `voiceStateUpdate`
- And any other Discord.js event

---

## Deployment

### Heroku Deployment

**Procfile**:
```
worker: node index.js
```

**Required Add-ons**:
- Heroku Postgres (Standard plan or higher for SSL in production)

**Config Vars**: Set all environment variables listed in [Setup & Configuration](#setup--configuration)

**Deployment Steps**:
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Set config vars
heroku config:set DISCORD_TOKEN=your_token
heroku config:set TWITCH_CLIENT_ID=your_id
# ... set all other vars

# Deploy
git push heroku main

# Initialize database
heroku run node dbInit.js

# Deploy commands to guild
heroku run node deploy-commands.js GUILD_ID

# Check logs
heroku logs --tail
```

### Database Management

**Migrations**: Not currently implemented (using Sequelize sync)

**Backup**:
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

**Manual Sync**:
```bash
# Be careful with --force (deletes all data)
heroku run node dbInit.js --alter
```

---

## Common Workflows

### Adding a New Guild

1. Bot joins guild (automatic via Discord)
2. `guildCreate` event fires
3. Settings entry created in database
4. Guild commands registered
5. Admin runs `/voicelink add` to configure voice roles (optional)
6. Admin sets up Twitch integration:
   - Set `twitch_id` in Settings
   - Set `reward_channel_id` for lottery
   - Set `reward_id` for specific channel point reward
   - Set `live_channel_id` for stream notifications
   - Set `cron_active` to enable monthly automation

### Setting Up Monthly Lottery

1. Configure Settings:
```javascript
await Settings.update({
    reward_channel_id: 'CHANNEL_ID',
    reward_id: 'TWITCH_REWARD_ID',
    twitch_id: 'BROADCASTER_ID',
    cron_active: true
}, { where: { guild_id: 'GUILD_ID' } });
```

2. Manually create first month's message:
```javascript
const { createNewTicketMessage } = require('./components/ticketsMessage');
const channel = await client.channels.fetch('CHANNEL_ID');
await createNewTicketMessage(channel);
```

3. Users redeem channel point reward on Twitch
4. Bot automatically updates Discord message
5. At end of month, admin uses `/select-a-winner`
6. On 1st of next month at 4 AM, cron job:
   - Finalizes previous month
   - Creates new month's message

### Troubleshooting

**Bot Not Responding to Commands**:
- Check bot is online: `heroku ps`
- Verify commands deployed: `node deploy-commands.js GUILD_ID`
- Check logs: `heroku logs --tail`
- Verify bot has proper permissions in Discord

**EventSub Not Working**:
- Development: Ensure ngrok is running
- Production: Verify `APP_NAME` environment variable
- Check subscriptions: `heroku run node` then use Twitch API to list
- Verify webhook secret matches: `'hyperSecretWord'`

**Database Errors**:
- Check connection: `heroku pg:info`
- Verify SSL settings (production requires SSL)
- Check model sync: `heroku run node dbInit.js --alter`

**Token Refresh Failing**:
- Verify `TWITCH_CLIENT_SECRET` is correct
- Check `TwitchAuth` table has valid refresh tokens
- User may need to re-authorize

---

## API Rate Limits

### Discord API
- 50 requests per second per route
- Commands: 200 creates per day per guild
- Messages: 5 per 5 seconds per channel

### Twitch API
- App tokens: 800 requests per minute
- User tokens: 800 requests per minute
- EventSub: 10,000 active subscriptions limit

### Best Practices
- Use batch operations when possible (`getUsersByIds` vs multiple `getUserById`)
- Cache Discord channels and roles
- Implement exponential backoff for retries
- Use EventSub instead of polling

---

## Security Considerations

### Secrets Management
- Never commit `.env` file
- Use environment variables for all credentials
- Rotate tokens periodically
- Use different credentials for dev/prod

### Database
- SSL required in production
- Unique constraints on sensitive fields
- No raw SQL queries (use Sequelize)

### OAuth Flow
- Verify state parameter (not currently implemented)
- Use HTTPS for callback URLs
- Store tokens encrypted at rest (consider implementing)

### Discord Permissions
- Use `setDefaultPermission(false)` for admin commands
- Verify user permissions in command execute
- Use ephemeral replies for sensitive data

---

## Future Enhancements

### Potential Improvements
1. **Migration System**: Implement proper Sequelize migrations instead of sync
2. **OAuth State**: Add CSRF protection to OAuth flow
3. **Error Logging**: Implement proper error tracking (e.g., Sentry)
4. **Metrics**: Add performance monitoring and analytics
5. **Testing**: Add unit and integration tests
6. **Localization**: Support multiple languages
7. **Dashboard**: Web interface for managing settings
8. **Backup System**: Automated database backups
9. **Rate Limiting**: Implement request throttling
10. **Documentation**: Auto-generate docs from code comments

---

## Support & Contributing

### Getting Help
- Check logs: `heroku logs --tail`
- Review this documentation
- Check Discord.js documentation: https://discord.js.org/
- Check Twurple documentation: https://twurple.js.org/

### Reporting Issues
Include:
- Bot version
- Node.js version
- Error messages from logs
- Steps to reproduce
- Expected vs actual behavior

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd workspace

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
node dbInit.js

# Start development
NODE_ENV=development npm run startBot
```

---

## License

[Specify license here]

## Version History

- **v1.0.0**: Initial release with core functionality
  - Voice role linking
  - Twitch integration
  - Monthly lottery system
  - Stream notifications

---

*Last Updated: 2024-01-15*
*Bot Version: 1.0.0*
