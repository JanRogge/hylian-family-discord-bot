# API Documentation

Comprehensive documentation for all public APIs, functions, and components in the Discord Bot project.

## Table of Contents

1. [Overview](#overview)
2. [Database Models](#database-models)
3. [Services](#services)
4. [Commands](#commands)
5. [Events](#events)
6. [Components](#components)
7. [Subscribers](#subscribers)
8. [Usage Examples](#usage-examples)

---

## Overview

This Discord bot integrates with Twitch to provide:
- Voice channel ↔ Role linking
- Twitch event tracking (bits, gifts, redemptions, stream online)
- Monthly ticket/raffle system
- Automated winner selection and message updates

### Key Technologies
- **Discord.js** v14 - Discord bot framework
- **Sequelize** - ORM for PostgreSQL
- **@twurple/api** - Twitch API client
- **@twurple/eventsub** - Twitch EventSub integration
- **node-cron** - Scheduled tasks

---

## Database Models

All models are Sequelize-based and exported from `/dbObjects.js`.

### Settings Model

**File:** `models/Settings.js`

Stores guild-specific configuration settings.

**Schema:**
```javascript
{
  config_id: INTEGER (Primary Key, Auto Increment),
  guild_id: STRING (Unique),
  reward_channel_id: STRING,
  reward_id: STRING,
  live_channel_id: STRING,
  twitch_id: STRING,
  cron_active: BOOLEAN
}
```

**Usage:**
```javascript
const { Settings } = require('./dbObjects');

// Find settings for a guild
const settings = await Settings.findOne({
  where: { guild_id: '123456789' }
});

// Create/update settings
await Settings.upsert({
  guild_id: '123456789',
  reward_channel_id: '987654321',
  twitch_id: '31547053',
  cron_active: true
});
```

**Fields:**
- `guild_id` - Discord guild ID
- `reward_channel_id` - Channel ID for reward/ticket messages
- `reward_id` - Twitch channel point reward ID
- `live_channel_id` - Channel ID for stream online notifications
- `twitch_id` - Twitch broadcaster user ID
- `cron_active` - Whether monthly cron job is active

---

### VoiceRoleLink Model

**File:** `models/VoiceRoleLink.js`

Links voice channels to roles that are assigned when users join.

**Schema:**
```javascript
{
  guild_id: STRING (Composite Unique),
  voice_channel_id: STRING (Composite Unique),
  role_ids: STRING (Comma-separated role IDs)
}
```

**Usage:**
```javascript
const { VoiceRoleLink } = require('./dbObjects');

// Create a voice-role link
await VoiceRoleLink.create({
  guild_id: '123456789',
  voice_channel_id: '111222333',
  role_ids: '444555666'
});

// Find links for a guild
const links = await VoiceRoleLink.findAll({
  where: { guild_id: '123456789' }
});
```

**Fields:**
- `guild_id` - Discord guild ID
- `voice_channel_id` - Voice channel ID
- `role_ids` - Comma-separated list of role IDs to assign

---

### Bits Model

**File:** `models/Bits.js`

Tracks Twitch bits (cheers) given to broadcasters.

**Schema:**
```javascript
{
  user_id: STRING,
  amount: INTEGER,
  broadcaster_id: STRING,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Usage:**
```javascript
const { Bits } = require('./dbObjects');

// Create a bits record
await Bits.create({
  user_id: 'twitch_user_id',
  amount: 100,
  broadcaster_id: '31547053'
});

// Query bits for a month
const bits = await Bits.findAll({
  where: {
    broadcaster_id: '31547053',
    [Op.and]: [
      Sequelize.fn('EXTRACT(MONTH from "createdAt") =', 12),
      Sequelize.fn('EXTRACT(YEAR from "createdAt") =', 2023)
    ]
  }
});
```

**Fields:**
- `user_id` - Twitch user ID who cheered
- `amount` - Number of bits cheered
- `broadcaster_id` - Twitch broadcaster user ID

---

### Gifts Model

**File:** `models/Gifts.js`

Tracks Twitch subscription gifts given to broadcasters.

**Schema:**
```javascript
{
  user_id: STRING,
  amount: INTEGER,
  broadcaster_id: STRING,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Usage:**
```javascript
const { Gifts } = require('./dbObjects');

// Create a gift record
await Gifts.create({
  user_id: 'twitch_user_id',
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
      Sequelize.fn('EXTRACT(MONTH from "createdAt") =', 12),
      Sequelize.fn('EXTRACT(YEAR from "createdAt") =', 2023)
    ]
  },
  order: [['totalGifts', 'DESC']],
  group: 'user_id'
});
```

**Fields:**
- `user_id` - Twitch user ID who gifted subscriptions
- `amount` - Number of subscriptions gifted
- `broadcaster_id` - Twitch broadcaster user ID

---

### Messages Model

**File:** `models/Messages.js`

Stores Discord message metadata for ticket/raffle messages.

**Schema:**
```javascript
{
  guild_id: STRING,
  channel_id: STRING,
  message_id: STRING,
  name: STRING (e.g., "Januar 2024"),
  done: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Usage:**
```javascript
const { Messages } = require('./dbObjects');

// Create a message record
await Messages.create({
  guild_id: '123456789',
  channel_id: '987654321',
  message_id: '111222333',
  name: 'Januar 2024',
  done: false
});

// Find message by name
const message = await Messages.findOne({
  where: {
    guild_id: '123456789',
    name: 'Januar 2024'
  }
});
```

**Fields:**
- `guild_id` - Discord guild ID
- `channel_id` - Discord channel ID
- `message_id` - Discord message ID
- `name` - Display name (typically "Month Year")
- `done` - Whether winner has been selected

---

### Rewards Model

**File:** `models/Rewards.js`

Tracks Twitch channel point redemptions for raffle entries.

**Schema:**
```javascript
{
  user_id: STRING,
  broadcaster_id: STRING,
  won: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Usage:**
```javascript
const { Rewards } = require('./dbObjects');

// Create a reward redemption
await Rewards.create({
  user_id: 'twitch_user_id',
  broadcaster_id: '31547053',
  won: false
});

// Mark as winner
await Rewards.update(
  { won: true },
  { where: { user_id: 'twitch_user_id' } }
);
```

**Fields:**
- `user_id` - Twitch user ID who redeemed
- `broadcaster_id` - Twitch broadcaster user ID
- `won` - Whether this user won the raffle

---

### TwitchAuth Model

**File:** `models/TwitchAuth.js`

Stores Twitch OAuth tokens for user authentication.

**Schema:**
```javascript
{
  access_token: STRING (Unique),
  refresh_token: STRING (Unique),
  expires_in: INTEGER,
  obtainment_timestamp: STRING,
  scope: ARRAY(STRING),
  user_id: STRING (Unique)
}
```

**Usage:**
```javascript
const { TwitchAuth } = require('./dbObjects');

// Store auth tokens
await TwitchAuth.create({
  access_token: 'token_here',
  refresh_token: 'refresh_token_here',
  expires_in: 3600,
  obtainment_timestamp: Date.now().toString(),
  scope: ['user:read:email'],
  user_id: 'twitch_user_id'
});

// Find tokens for user
const tokens = await TwitchAuth.findOne({
  where: { user_id: 'twitch_user_id' }
});
```

**Fields:**
- `access_token` - OAuth access token
- `refresh_token` - OAuth refresh token
- `expires_in` - Token expiration time in seconds
- `obtainment_timestamp` - When token was obtained
- `scope` - Array of OAuth scopes
- `user_id` - Twitch user ID

---

## Services

### Twitch API Client

**File:** `services/twitchApiClient.js`

Manages Twitch API authentication and client initialization.

#### `start(client)`

Initializes the Twitch API client with app token authentication.

**Parameters:**
- `client` (Discord.Client) - Discord client instance

**Returns:** `Promise<void>`

**Usage:**
```javascript
const twitchApiClient = require('./services/twitchApiClient');

await twitchApiClient.start(client);
// client.apiClient and client.authProvider are now available
```

**What it does:**
- Creates a `RefreshingAuthProvider` for token management
- Sets up token refresh callbacks
- Creates an `ApiClient` instance
- Attaches `apiClient` and `authProvider` to the Discord client

---

#### `addUser(client, userId)`

Adds a user's Twitch authentication to the auth provider.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch user ID

**Returns:** `Promise<void>`

**Usage:**
```javascript
await twitchApiClient.addUser(client, '31547053');
```

**What it does:**
- Retrieves stored tokens from database
- Adds user token to auth provider
- Updates API client with new user context

---

### EventSub Listener

**File:** `services/eventSubListener.js`

Manages Twitch EventSub HTTP listener for webhook subscriptions.

#### `start(client)`

Starts the EventSub HTTP listener.

**Parameters:**
- `client` (Discord.Client) - Discord client instance

**Returns:** `Promise<void>`

**Usage:**
```javascript
const eventSubListener = require('./services/eventSubListener');

await eventSubListener.start(client);
// client.listener and client.appClient are now available
```

**What it does:**
- Creates app token auth provider
- Sets up adapter (Ngrok for development, EnvPort for production)
- Initializes EventSub HTTP listener
- Attaches `listener` and `appClient` to Discord client
- Creates `client.subs` Collection for managing subscriptions

**Environment-specific behavior:**
- **Development:** Uses Ngrok adapter, deletes all existing subscriptions
- **Production:** Uses EnvPort adapter with Heroku hostname

---

### Cron Service

**File:** `services/cron.js`

Manages scheduled tasks using node-cron.

#### `start(client)`

Starts all cron jobs.

**Parameters:**
- `client` (Discord.Client) - Discord client instance

**Returns:** `void`

**Usage:**
```javascript
const cron = require('./services/cron');

cron.start(client);
```

**Scheduled Tasks:**

1. **Monthly Ticket Update** (Runs 4:00 AM on 1st of month, Europe/Berlin timezone)
   - Updates ticket messages for previous month
   - Creates new ticket message for current month
   - Only runs for guilds with `cron_active: true`

2. **Heroku Ping** (Runs every 10 minutes)
   - Sends GET request to Heroku app URL to prevent sleep
   - URL: `https://${process.env.APP_NAME}.herokuapp.com/`

---

## Commands

All commands are Discord slash commands using Discord.js v14.

### Help Command

**File:** `commands/help.js`

Displays available commands or information about a specific command.

**Command:** `/help [command]`

**Options:**
- `command` (string, optional) - Name of command to get info about

**Usage:**
```
/help
/help voicelink
```

**Example Response:**
```
Here's a list of all my commands:
help, twitch-connect, voicelink, select-a-winner, reload-message, update-bits, update-gifter
You can send `/help [command name]` to get info on a specific command!
```

---

### Twitch Connect Command

**File:** `commands/twitchlink.js`

Provides a button to connect Twitch account via OAuth.

**Command:** `/twitch-connect`

**Usage:**
```
/twitch-connect
```

**Response:**
- Sends ephemeral message with button linking to Twitch OAuth authorization URL

**OAuth URL Format:**
```
https://id.twitch.tv/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={CALLBACK_URL}&response_type=code&scope={SCOPE}
```

---

### Voice Link Command

**File:** `commands/voicelink.js`

Manages voice channel to role linking.

**Command:** `/voicelink <subcommand>`

**Subcommands:**

#### `add`
Adds a role to a voice channel link.

**Options:**
- `role` (role, required) - Role to assign when joining voice channel

**Usage:**
```
/voicelink add role:@Member
```

**Requirements:**
- User must be in the target voice channel
- Bot must have permission to manage roles

**Response:**
- Creates new link or updates existing link with additional role
- Returns confirmation message with channel and role mentions

#### `delete`
Removes a role from a voice channel link.

**Options:**
- `role` (role, required) - Role to remove from voice channel link

**Usage:**
```
/voicelink delete role:@Member
```

**Requirements:**
- User must be in the target voice channel
- Bot must have permission to manage roles

**Response:**
- Removes role from link or deletes link if it's the last role
- Returns confirmation message

**Permissions:** Requires administrator permission

---

### Select Winner Command

**File:** `commands/winner.js`

Selects a winner for a monthly raffle.

**Command:** `/select-a-winner`

**Options:**
- `monat-jahr` (string, required, autocomplete) - Month and year (e.g., "Januar 2024")
- `user` (string, required, autocomplete) - Twitch username of winner

**Usage:**
```
/select-a-winner monat-jahr:Januar 2024 user:username123
```

**What it does:**
1. Fetches ticket message for specified month
2. Updates message with winner marked
3. Marks message as done
4. Updates reward record to mark user as winner

**Autocomplete:**
- `monat-jahr`: Shows available months from Messages table where `done: false`
- `user`: Shows Twitch users who redeemed rewards in the selected month

**Response:**
- Updates Discord message with winner highlighted
- Confirms winner selection

---

### Reload Message Command

**File:** `commands/reload-message.js`

Reloads/updates a ticket message for a specific month.

**Command:** `/reload-message`

**Options:**
- `monat-jahr` (string, required, autocomplete) - Month and year to reload

**Usage:**
```
/reload-message monat-jahr:Januar 2024
```

**What it does:**
1. Fetches message for specified month
2. Retrieves current data (top gifter, top cheerer, redemptions)
3. Updates message with current data

**Autocomplete:**
- Shows available months from Messages table

**Response:**
- Updates Discord message with latest data
- Confirms message reload

---

### Update Bits Command

**File:** `commands/update-bits.js`

Manually updates the top cheerer for a month.

**Command:** `/update-bits`

**Options:**
- `monat-jahr` (string, required, autocomplete) - Month and year
- `user` (string, required) - Twitch username to set as top cheerer

**Usage:**
```
/update-bits monat-jahr:Januar 2024 user:username123
```

**What it does:**
- Updates ticket message with specified user as top cheerer
- Preserves other data (top gifter, redemptions, winner)

**Response:**
- Updates Discord message
- Confirms bits update

---

### Update Gifter Command

**File:** `commands/update-gifter.js`

Manually updates the top gifter for a month.

**Command:** `/update-gifter`

**Options:**
- `monat-jahr` (string, required, autocomplete) - Month and year
- `user` (string, required) - Twitch username to set as top gifter

**Usage:**
```
/update-gifter monat-jahr:Januar 2024 user:username123
```

**What it does:**
- Updates ticket message with specified user as top gifter
- Preserves other data (top cheerer, redemptions, winner)

**Response:**
- Updates Discord message
- Confirms gifter update

---

## Events

### Ready Event

**File:** `events/ready.js`

Fires once when the bot is ready.

**Event:** `ready`

**Usage:**
```javascript
// Automatically loaded by event handler
// Logs "Ready!" to console when bot connects
```

---

### Interaction Create Event

**File:** `events/interactionCreate.js`

Handles all Discord interactions (commands and autocomplete).

**Event:** `interactionCreate`

**What it does:**
- Executes slash commands
- Handles autocomplete interactions
- Error handling for command execution

**Usage:**
```javascript
// Automatically loaded by event handler
// No manual usage required
```

---

### Voice State Update Event

**File:** `events/voiceStateUpdate.js`

Manages role assignment/removal based on voice channel presence.

**Event:** `voiceStateUpdate`

**What it does:**
- When user joins a linked voice channel: Adds associated roles
- When user leaves a linked voice channel: Removes associated roles
- Handles multiple roles per channel

**Usage:**
```javascript
// Automatically loaded by event handler
// Requires VoiceRoleLink entries in database
```

**Error Handling:**
- Silently handles cases where bot's role is below target role
- Logs errors to console

---

### Guild Create Event

**File:** `events/guildCreate.js`

Handles bot joining a new guild.

**Event:** `guildCreate`

**What it does:**
1. Creates default Settings entry for guild
2. Registers guild-specific commands:
   - `/help`
   - `/twitch-connect`
   - `/voicelink`
   - `/select-a-winner`

**Usage:**
```javascript
// Automatically loaded by event handler
// Runs when bot is added to a server
```

---

### Guild Delete Event

**File:** `events/guildDelete.js`

Handles bot leaving a guild.

**Event:** `guildDelete`

**What it does:**
- Deletes Settings entries for the guild
- Deletes all VoiceRoleLink entries for the guild

**Usage:**
```javascript
// Automatically loaded by event handler
// Runs when bot is removed from a server
```

---

## Components

### Tickets Message Component

**File:** `components/ticketsMessage.js`

Manages ticket/raffle message creation and updates.

#### `fetchData(client, date, broadcaster)`

Fetches aggregated data for a specific month.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `date` (object) - `{ month: number, year: number }`
- `broadcaster` (string) - Twitch broadcaster user ID

**Returns:** `Promise<object>`

**Return Object:**
```javascript
{
  topGifter: TwitchUser | null,
  topCheerer: TwitchUser | null,
  redemptionUsers: TwitchUser[]
}
```

**Usage:**
```javascript
const { fetchData } = require('./components/ticketsMessage');

const data = await fetchData(client, { month: 12, year: 2023 }, '31547053');
console.log(data.topGifter.displayName);
```

**What it does:**
1. Finds top gifter from Gifts table (sum of gifts per user)
2. Gets top cheerer from Twitch Bits leaderboard API
3. Fetches all users who redeemed rewards in the month
4. Returns user objects with display names

---

#### `fetchTicketMessage(client, guildId, date)`

Fetches ticket message for a specific month.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `guildId` (string) - Discord guild ID
- `date` (object) - `{ month: number, year: number }`

**Returns:** `Promise<object>`

**Return Object:**
```javascript
{
  channel: Discord.Channel,
  message: Messages | null
}
```

**Usage:**
```javascript
const { fetchTicketMessage } = require('./components/ticketsMessage');

const { channel, message } = await fetchTicketMessage(
  client,
  '123456789',
  { month: 12, year: 2023 }
);
```

---

#### `createNewTicketMessage(channel)`

Creates a new ticket message for the current month.

**Parameters:**
- `channel` (Discord.TextChannel) - Channel to send message in

**Returns:** `Promise<void>`

**Usage:**
```javascript
const { createNewTicketMessage } = require('./components/ticketsMessage');

await createNewTicketMessage(channel);
```

**What it does:**
1. Creates message template with current month/year
2. Sends message to channel
3. Creates Messages database record
4. Sets `done: false`

**Message Template:**
```
**Glückslose [Month] [Year]:**



**Gewinner:**
Top-Subgifter: 
Top-Cheerer: 
Los-Gewinner:
```

---

#### `updateTicketMessage(messageToUpdateId, channel, date, redemptions, top)`

Updates an existing ticket message with data.

**Parameters:**
- `messageToUpdateId` (string) - Discord message ID
- `channel` (Discord.TextChannel) - Channel containing the message
- `date` (object) - `{ month: number, year: number }`
- `redemptions` (string) - Formatted string of redemption usernames (newline-separated)
- `top` (object) - `{ gifter?: TwitchUser, cheerer?: TwitchUser, winner?: TwitchUser }`

**Returns:** `Promise<void>`

**Usage:**
```javascript
const { updateTicketMessage } = require('./components/ticketsMessage');

await updateTicketMessage(
  '111222333',
  channel,
  { month: 12, year: 2023 },
  'user1\nuser2\nuser3',
  {
    gifter: topGifterUser,
    cheerer: topCheererUser,
    winner: winnerUser
  }
);
```

**What it does:**
1. Formats message template with provided data
2. Updates Discord message content
3. Highlights winner if provided

**Message Format:**
```
**Glückslose [Month] [Year]:**

[Redemptions List]

**Gewinner:**
Top-Subgifter: [Gifter Name]
Top-Cheerer: [Cheerer Name]
Los-Gewinner: [Winner Name]
```

---

## Subscribers

Subscribers handle Twitch EventSub webhook events.

### Auth Subscriber

**File:** `subscriber/appSubscriptions/authSubscriber.js`

Manages user authorization and subscription initialization.

#### `start(client)`

Initializes auth subscriber and sets up user subscriptions.

**Parameters:**
- `client` (Discord.Client) - Discord client instance

**Returns:** `Promise<void>`

**What it does:**
1. Starts Twitch API client
2. Loads existing guild settings with Twitch IDs
3. Adds subscriptions for each broadcaster
4. Listens for new user authorizations
5. Automatically adds subscriptions when users authorize

**Usage:**
```javascript
const authSubscriber = require('./subscriber/appSubscriptions/authSubscriber');

await authSubscriber.start(client);
```

---

#### `add(client, userId)`

Adds a user to the subscription system.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch user ID

**Returns:** `Promise<void>`

**What it does:**
1. Adds user to Twitch API client
2. Creates subscription collection for user
3. Starts all user subscriptions:
   - Cheer subscription
   - Gift subscription
   - Online subscription
   - Redemption subscription

---

### Cheer Subscription

**File:** `subscriber/userSubscriptions/cheerSubscription.js`

Tracks Twitch bits (cheers) events.

**Event:** `channel.cheer`

#### `start(client, userId)`

Starts listening for cheer events.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

**What it does:**
- Subscribes to cheer events for the broadcaster
- Creates Bits database records for non-anonymous cheers
- Stores subscription in `client.subs` collection

**Usage:**
```javascript
// Automatically called by authSubscriber
// No manual usage required
```

---

#### `stop(client, userId)`

Stops the cheer subscription.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

---

### Gift Subscription

**File:** `subscriber/userSubscriptions/giftSubscription.js`

Tracks Twitch subscription gift events.

**Event:** `channel.subscription.gift`

#### `start(client, userId)`

Starts listening for gift events.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

**What it does:**
- Subscribes to subscription gift events
- Creates Gifts database records for non-anonymous gifts
- Stores subscription in `client.subs` collection

---

#### `stop(client, userId)`

Stops the gift subscription.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

---

### Online Subscription

**File:** `subscriber/userSubscriptions/onlineSubscription.js`

Sends Discord notifications when stream goes live.

**Event:** `stream.online`

#### `start(client, userId)`

Starts listening for stream online events.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

**What it does:**
1. Subscribes to stream online events
2. When stream goes live:
   - Fetches stream details
   - Fetches broadcaster info
   - Creates Discord embed with stream info
   - Sends notification to configured channel

**Embed Includes:**
- Stream title
- Stream thumbnail
- Broadcaster name and avatar
- Link to Twitch channel

**Usage:**
```javascript
// Automatically called by authSubscriber
// Requires Settings.live_channel_id to be configured
```

---

#### `stop(client, userId)`

Stops the online subscription.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

---

### Redemption Subscription

**File:** `subscriber/userSubscriptions/redemptionSubscription.js`

Tracks channel point redemptions for raffle entries.

**Event:** `channel.channel_points_custom_reward_redemption.add`

#### `start(client, userId)`

Starts listening for redemption events.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

**What it does:**
1. Subscribes to redemption events (specific reward if configured, or all rewards)
2. When redemption occurs:
   - Checks if user already redeemed this month
   - Cancels duplicate redemptions
   - Creates Rewards database record
   - Updates ticket message with new redemption list

**Duplicate Prevention:**
- Checks for existing redemption in current month
- Cancels redemption via Twitch API if duplicate found

**Usage:**
```javascript
// Automatically called by authSubscriber
// Requires Settings.reward_id to be configured for specific reward filtering
```

---

#### `stop(client, userId)`

Stops the redemption subscription.

**Parameters:**
- `client` (Discord.Client) - Discord client instance
- `userId` (string) - Twitch broadcaster user ID

**Returns:** `Promise<void>`

---

## Usage Examples

### Setting Up a New Guild

```javascript
// 1. Bot joins guild (guildCreate event handles this)
// 2. Configure settings
const { Settings } = require('./dbObjects');

await Settings.upsert({
  guild_id: 'YOUR_GUILD_ID',
  reward_channel_id: 'YOUR_REWARD_CHANNEL_ID',
  live_channel_id: 'YOUR_LIVE_CHANNEL_ID',
  twitch_id: 'YOUR_TWITCH_USER_ID',
  cron_active: true
});

// 3. Users connect Twitch via /twitch-connect command
// 4. Set up voice links via /voicelink command
```

---

### Creating a Voice-Role Link

```javascript
// Via Discord command:
/voicelink add role:@Member

// Or programmatically:
const { VoiceRoleLink } = require('./dbObjects');

await VoiceRoleLink.create({
  guild_id: '123456789',
  voice_channel_id: '111222333',
  role_ids: '444555666'
});
```

---

### Manually Updating Ticket Message

```javascript
const { Messages, Settings } = require('./dbObjects');
const { updateTicketMessage, fetchData } = require('./components/ticketsMessage');

const settings = await Settings.findOne({
  where: { guild_id: '123456789' }
});

const message = await Messages.findOne({
  where: {
    guild_id: '123456789',
    name: 'Januar 2024'
  }
});

const channel = await client.channels.fetch(settings.reward_channel_id);

const { topGifter, topCheerer, redemptionUsers } = await fetchData(
  client,
  { month: 1, year: 2024 },
  settings.twitch_id
);

const redemptionsString = redemptionUsers
  .map(u => u.displayName)
  .sort()
  .join('\n');

await updateTicketMessage(
  message.message_id,
  channel,
  { month: 1, year: 2024 },
  redemptionsString,
  {
    gifter: topGifter,
    cheerer: topCheerer
  }
);
```

---

### Querying Monthly Statistics

```javascript
const { Bits, Gifts, Rewards } = require('./dbObjects');
const { Sequelize, Op } = require('sequelize');

const month = 12;
const year = 2023;
const broadcasterId = '31547053';

// Get total bits cheered
const totalBits = await Bits.sum('amount', {
  where: {
    broadcaster_id: broadcasterId,
    [Op.and]: [
      Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month),
      Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year)
    ]
  }
});

// Get total gifts given
const totalGifts = await Gifts.sum('amount', {
  where: {
    broadcaster_id: broadcasterId,
    [Op.and]: [
      Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month),
      Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year)
    ]
  }
});

// Get redemption count
const redemptionCount = await Rewards.count({
  where: {
    broadcaster_id: broadcasterId,
    [Op.and]: [
      Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month),
      Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year)
    ]
  }
});
```

---

### Using Twitch API Client

```javascript
// After twitchApiClient.start(client) is called:

// Get user info
const user = await client.apiClient.users.getUserById('31547053');
console.log(user.displayName);

// Get bits leaderboard
const leaderboard = await client.apiClient.bits.getLeaderboard(
  '31547053',
  {
    count: 10,
    period: 'month',
    startDate: new Date('2023-12-01T08:00:00.0Z')
  }
);

// Get multiple users
const users = await client.apiClient.users.getUsersByIds([
  '31547053',
  '12345678'
]);
```

---

## Environment Variables

Required environment variables:

```bash
# Discord
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Twitch
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_CALLBACK_URL=your_oauth_callback_url
SCOPE=your_oauth_scopes

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Deployment
NODE_ENV=production|development
APP_NAME=your_heroku_app_name
```

---

## Error Handling

### Common Errors

1. **Token Refresh Failed**
   - Check Twitch client credentials
   - Verify database connection for token storage

2. **Role Management Errors**
   - Ensure bot's role is above target roles
   - Check bot has "Manage Roles" permission

3. **EventSub Subscription Errors**
   - Verify webhook URL is accessible
   - Check Twitch EventSub subscription status
   - Ensure correct secret is configured

4. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL server is running
   - Verify SSL settings for production

---

## Best Practices

1. **Database Queries**
   - Always use Sequelize methods instead of raw SQL
   - Use transactions for multi-step operations
   - Handle unique constraint errors gracefully

2. **Discord Interactions**
   - Always reply to interactions (ephemeral for sensitive operations)
   - Handle autocomplete interactions separately
   - Validate user permissions before executing commands

3. **Twitch API**
   - Use `client.apiClient` for authenticated requests
   - Use `client.appClient` for app-level requests
   - Handle rate limits appropriately

4. **Error Handling**
   - Log errors with context
   - Provide user-friendly error messages
   - Don't expose sensitive information in errors

---

## License

ISC

---

## Support

For issues or questions, refer to the project repository or contact the maintainers.
