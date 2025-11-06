## Discord Bot API Guide

This guide documents every exported module, public function, and runtime component in the Discord/Twitch integration bot. It explains what each piece does, required configuration, and shows example usage so you can extend or integrate with confidence.

---

### Runtime Overview

- **Entry point:** `index.js` instantiates a Discord client with guild, member, message, reaction, and voice intents. It bootstraps command/event handlers, starts Twitch EventSub listeners, registers authentication subscribers, and launches scheduled jobs.
- **Environment:** The bot expects these environment variables:
  - `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`
  - `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_CALLBACK_URL`, `SCOPE`
  - `APP_NAME` (for Heroku pings and production EventSub host), `NODE_ENV`
  - `DATABASE_URL`
- **Authentication flow:** `services/eventSubListener` sets up the EventSub HTTP listener (ngrok in development, EnvPortAdapter in production). `subscriber/appSubscriptions/authSubscriber` wires Twitch OAuth grants into user-specific subscriptions and API clients backed by `services/twitchApiClient`.

```startLine:endLine:index.js
require('./handlers/commandLoader')(client);
require('./handlers/events')(client);
await eventSubListener.start(client);
await authSubscriber.start(client);
cron.start(client);
```

---

### Command Modules (`commands/`)

All command modules export the Discord.js `SlashCommandBuilder` metadata and an `execute(interaction)` handler. Autocomplete-capable commands additionally export `autocomplete(interaction)`.

- **`help.js`** (`/help [command]`)
  - Replies with the list of registered slash commands or details for a specific command.
  - Example: `/help` → ephemeral list of commands. `/help command:select-a-winner` → details for the winner command.
- **`reload-message.js`** (`/reload-message monat-jahr:<Month Year>`)
  - Rebuilds a reward summary message for the selected month. Pulls data via `components/ticketsMessage.fetchData`, uses the stored Discord message in `Messages`, and rewrites it with current gifter/cheerer/winner.
  - Autocomplete supplies valid month-year labels from the database.
  - Example: `/reload-message monat-jahr:"September 2024"`
- **`update-bits.js`** (`/update-bits monat-jahr:<Month Year> user:<Display Name>`)
  - Overrides the recorded top cheerer (`Top-Cheerer`) for the given month, while keeping gifter and winner data synchronized.
- **`update-gifter.js`** (`/update-gifter monat-jahr:<Month Year> user:<Display Name>`)
  - Overrides the recorded top gifter (`Top-Subgifter`) for the month.
- **`select-a-winner.js`** (`/select-a-winner monat-jahr:<Month Year> user:<Display Name>`)
  - Marks a redemption user as that month’s winner. Updates the aggregated message, flags the month’s `Messages` row as `done`, and sets the winner’s `Rewards.won = true`.
  - Autocomplete provides open months and eligible redeeming users (fetched via Twitch API and local DB).
- **`twitchlink.js`** (`/twitch-connect`)
  - Responds with a Twitch OAuth link button built from `process.env.TWITCH_*` values.
- **`voicelink.js`** (`/voicelink add|delete role:<Role>`)
  - Maintains `VoiceRoleLink` records that associate voice channels with role grants/removals.
  - `add`: Must be used while in the voice channel to bind; appends roles if a link exists, otherwise creates.
  - `delete`: Removes a specific role from the channel’s role list or deletes the link when the last role is removed.
  - Additional exported helpers: `disable(interaction)` removes all voice links for a guild; `enable()` currently no-ops.

**Shared patterns:** Commands rely on database helpers in `dbObjects.js` for Sequelize models and on `components/ticketsMessage` for message formatting.

```startLine:endLine:commands/winner.js
await updateTicketMessage(message.message_id, channel, { month, year }, redemptionsString, {
  gifter: topGifter,
  cheerer: topCheerer,
  winner,
});
```

---

### Event Handlers (`events/`)

Handlers are auto-registered by `handlers/events.js`. Each module exports `{ name, once?, execute }`.

- **`ready.js`** — Logs readiness once the Discord client is live.
- **`guildCreate.js`**
  - Ensures `Settings` entry exists for the new guild.
  - Installs core slash commands (`help`, `twitch-connect`, `voicelink`, `select-a-winner`).
- **`guildDelete.js`** — Cleans up `Settings` and `VoiceRoleLink` records when the bot leaves a guild.
- **`interactionCreate.js`**
  - Routes slash commands to their `execute` handler and autocompletes to `autocomplete`.
  - Example integration:

```startLine:endLine:events/interactionCreate.js
if (interaction.isChatInputCommand()) {
  const command = interaction.client.commands.get(interaction.commandName);
  await command.execute(interaction);
}
```

- **`voiceStateUpdate.js`** — Applies voice role linking logic: on channel change it removes old roles and adds new ones based on `VoiceRoleLink` table entries.

---

### Scheduling & Background Services (`services/`)

- **`cron.start(client)`**
  - Runs a monthly job (`0 4 1 * *`, Europe/Berlin) for guilds with `cron_active = true`:
    1. Looks up the previous month’s ticket message (`fetchTicketMessage`).
    2. Computes Twitch stats via `fetchData`.
    3. Sorts redeemers alphabetically and rewrites the message.
    4. Calls `createNewTicketMessage` to begin the new month.
  - Also pings the Heroku app every 10 minutes to prevent idling.
- **`eventSubListener.start(client)`**
  - Creates an `AppTokenAuthProvider` and EventSub HTTP listener.
  - Uses `NgrokAdapter` in development, `EnvPortAdapter` in production.
  - Exposes the listener and Twitch `ApiClient` on the Discord client instance for downstream consumers.
- **`twitchApiClient.start(client)` / `addUser(client, userId)`**
  - Boots a `RefreshingAuthProvider` seeded with the app credentials.
  - On refresh, updates persisted tokens in `TwitchAuth`.
  - `addUser` loads stored tokens, registers them with the auth provider, and refreshes the shared `ApiClient` so Twitch user-scoped requests succeed.

Example: ensure Twitch API access before hitting Twurple endpoints.

```startLine:endLine:services/twitchApiClient.js
await client.authProvider.addUserForToken({
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  expiresIn: tokens.expires_in,
  obtainmentTimestamp: tokens.obtainment_timestamp,
  scope: tokens.scope,
});
```

---

### Component Utilities (`components/ticketsMessage.js`)

Exports utility functions for synchronizing Discord messages with Twitch data.

- **`fetchData(client, { month, year }, broadcasterId)`** → `{ topGifter, topCheerer, redemptionUsers }`
  - Aggregates monthly `Gifts` totals, queries Twitch Bits leaderboard, and loads redemption users via Twurple.
  - Example:

```javascript
const { fetchData } = require('../components/ticketsMessage');
const stats = await fetchData(client, { month: 10, year: 2025 }, '31547053');
console.log(stats.topGifter?.displayName);
```

- **`fetchTicketMessage(client, guildId, { month, year })`** → `{ channel, message }`
  - Loads the configured reward channel and matching `Messages` row for the month.
- **`createNewTicketMessage(channel)`**
  - Sends a template “Glückslose” message and persists a new `Messages` record for tracking.
- **`updateTicketMessage(messageId, channel, { month, year }, redemptionList, { gifter, cheerer, winner })`**
  - Rewrites the stored message with formatted redemption names and leader metadata. Provide `redemptionList` as a newline-delimited string, or `null`/`undefined` for an empty slot.

These helpers assume the Discord channel is already fetched and that Twitch API clients on `client` are authenticated.

---

### Database Access Layer (`dbObjects.js` and `models/`)

`dbObjects.js` configures a Sequelize instance (honoring SSL in production) and exports the models below. Import it once and destructure the models you need.

- **`Settings`** (`config` table)
  - Key fields: `guild_id` (unique), `reward_channel_id`, `reward_id` (Twitch reward ID), `live_channel_id`, `twitch_id`, `cron_active` (boolean toggle).
- **`VoiceRoleLink`** (`vcrolelink` table)
  - Composite unique key on `{ guild_id, voice_channel_id }`; stores a comma-delimited `role_ids` string.
- **`Bits`** / **`Gifts`**
  - Track individual cheers and subscription gifts with `user_id`, `amount`, `broadcaster_id`, timestamps.
- **`Messages`**
  - Persists Discord message metadata for monthly reward posts (`done` flag indicates whether a winner was chosen).
- **`Rewards`**
  - Logs channel point redemptions (`won` marks the monthly winner).
- **`TwitchAuth`**
  - Stores Twitch OAuth tokens (`access_token`, `refresh_token`, `scope`, `expires_in`, etc.) for each broadcaster (`user_id`).

**Initialization scripts:**
- `dbInit.js` mirrors the production connection settings and seeds a default guild when run with optional `--force` / `--alter` flags for schema sync.

---

### Subscriber Pipeline (`subscriber/`)

The subscriber layer ties EventSub notifications to bot behavior.

- **App-level subscriptions (`appSubscriptions/`)**
  - `authSubscriber.start(client)`
    - Initializes Twitch API access (`twitchApiClient.start`).
    - Loads all guilds with a configured `twitch_id`, calls `add(client, twitchId)` to provision user-scoped API clients and user subscriptions.
    - Registers an authorization grant EventSub hook to repeat the provisioning when new users authorize.
  - `authSubscriber.add(client, userId)`
    - Adds the user to the `RefreshingAuthProvider` and iterates over `subscriber/userSubscriptions` to start each subscription type.
  - `unAuthSubscriber.start(client)`
    - Listens for authorization revocations, stops stored subscriptions, removes the user from the auth provider, and deletes stored tokens.

- **User-level subscriptions (`userSubscriptions/`)** — Each module exports `{ name, start(client, userId), stop(client, userId) }`.
  - `cheerSubscription` — On channel cheers, records non-anonymous bit donations (`Bits.create`).
  - `giftSubscription` — On gifted subs, records gifts via `Gifts.create`.
  - `onlineSubscription` — On stream going live, posts an embed + announcement into the guild’s `live_channel_id`.
  - `redemptionSubscription` — On reward redemption, ensures a single ticket per user per month, persists to `Rewards`, and refreshes the monthly ticket message.

Example: stopping a specific subscription when cleaning up credentials.

```startLine:endLine:subscriber/userSubscriptions/cheerSubscription.js
const subscription = client.subs.get(userId).get(this.name);
subscription.stop();
client.subs.get(userId).delete(this.name);
```

---

### Deployment & Maintenance Scripts

- **`deploy-commands.js <guildId>`**
  - Reads each file in `commands/`, registers slash commands for the target guild using Discord REST API. Requires `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`.
  - Example: `node deploy-commands.js 123456789012345678`.
- **`commands/voicelink.disable(interaction)`**
  - Helper for moderators to clear all voice links in a guild. Example call: `await client.commands.get('voicelink').disable(interaction);`
- **Procfile (`web: node index.js`)**
  - Ensures Heroku or similar process managers launch the bot via the main entry point.

---

### Extending the Bot

When adding new functionality:

1. **Add Slash Commands** under `commands/`, export `{ data, execute, autocomplete? }`. Update docs and redeploy via `deploy-commands.js` or let `guildCreate` auto-install.
2. **Share Twitch Interactions** by reusing `client.apiClient` from `twitchApiClient` and `fetchData` helpers.
3. **Persist State** through the provided Sequelize models; extend `dbInit.js` if you need migrations/seed data.
4. **Emit Discord Messages** using the patterns in `components/ticketsMessage.js` to keep formatting consistent.

For testing, mock Discord interactions with `@discordjs/rest` and Twurple clients. Ensure environment variables are set or stubbed before invoking exported functions.

---

For questions or contributions, review `readme.md` for setup basics, then use this guide as the authoritative reference for module behavior and integration points.
