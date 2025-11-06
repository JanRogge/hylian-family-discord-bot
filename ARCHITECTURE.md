# Architecture Documentation

This document provides a technical overview of the Discord bot's architecture, design patterns, and system integration.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Discord Bot                           │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Discord.js │  │   Sequelize  │  │   Twurple    │      │
│  │   Client    │  │     ORM      │  │  API Client  │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐      ┌───────────┐     ┌──────────┐
  │ Discord  │      │PostgreSQL │     │  Twitch  │
  │   API    │      │ Database  │     │   API    │
  └──────────┘      └───────────┘     └──────────┘
```

## Technology Stack

### Core Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 16.9.0+ | Runtime environment |
| Discord.js | ^14.0.0 | Discord API wrapper |
| Sequelize | ^6.5.0 | ORM for database |
| @twurple/api | ^6.0.0 | Twitch API client |
| @twurple/auth | ^6.0.0 | Twitch authentication |
| @twurple/eventsub-ws | ^6.0.0 | Twitch EventSub listener |
| node-cron | 3.0.0 | Scheduled tasks |
| PostgreSQL | - | Relational database |

### Supporting Libraries

- **dotenv**: Environment variable management
- **axios**: HTTP client for keep-alive pings
- **pg**: PostgreSQL driver
- **@keyv/postgres**: Key-value storage adapter

## Project Structure

```
/workspace/
├── commands/              # Slash command modules
│   ├── help.js
│   ├── reload-message.js
│   ├── twitchlink.js
│   ├── update-bits.js
│   ├── update-gifter.js
│   ├── voicelink.js
│   └── winner.js
│
├── components/            # Reusable components
│   └── ticketsMessage.js  # Lottery message management
│
├── events/                # Discord event handlers
│   ├── ready.js
│   ├── guildCreate.js
│   ├── guildDelete.js
│   ├── interactionCreate.js
│   └── voiceStateUpdate.js
│
├── handlers/              # Dynamic loaders
│   ├── commandLoader.js   # Loads command modules
│   └── events.js          # Registers event listeners
│
├── models/                # Sequelize models
│   ├── Bits.js
│   ├── Gifts.js
│   ├── Messages.js
│   ├── Rewards.js
│   ├── Settings.js
│   ├── TwitchAuth.js
│   └── VoiceRoleLink.js
│
├── services/              # External integrations
│   ├── cron.js            # Scheduled tasks
│   ├── eventSubListener.js # Twitch EventSub setup
│   └── twitchApiClient.js # Twitch API client
│
├── subscriber/            # Twitch event subscriptions
│   ├── appSubscriptions/
│   │   ├── authSubscriber.js    # User auth grant
│   │   └── unAuthSubscriber.js  # User auth revoke
│   └── userSubscriptions/
│       ├── cheerSubscription.js      # Bits tracking
│       ├── giftSubscription.js       # Gift subs
│       ├── onlineSubscription.js     # Stream online
│       └── redemptionSubscription.js # Channel points
│
├── index.js               # Application entry point
├── dbInit.js              # Database initialization
├── dbObjects.js           # Model exports
├── deploy-commands.js     # Command deployment script
└── package.json           # Dependencies and scripts
```

## Initialization Flow

### Boot Sequence

```javascript
// 1. Load environment variables
require('dotenv').config();

// 2. Create Discord client with intents
const client = new Client({
    intents: [
        Guilds,
        GuildMembers,
        GuildMessages,
        GuildMessageReactions,
        GuildVoiceStates
    ]
});

// 3. Load handlers
require('./handlers/commandLoader')(client);
require('./handlers/events')(client);

// 4. Start Twitch services
await eventSubListener.start(client);   // App token + EventSub
await authSubscriber.start(client);     // User subscriptions

// 5. Start cron jobs
cron.start(client);

// 6. Login to Discord
client.login();
```

### Service Initialization Dependencies

```
client
  ├── commandLoader (sync)
  ├── events (sync)
  ├── eventSubListener (async)
  │     └── Creates: client.listener, client.appClient
  │
  ├── authSubscriber (async)
  │     ├── Requires: eventSubListener (client.listener)
  │     ├── Starts: twitchApiClient
  │     │     └── Creates: client.apiClient, client.authProvider
  │     └── Creates: client.subs (Collection)
  │
  └── cron (sync)
        └── Schedules: Monthly tasks, keep-alive pings
```

## Data Flow Patterns

### Command Execution Flow

```
User types /command
        ↓
Discord API
        ↓
Bot receives interactionCreate event
        ↓
events/interactionCreate.js
        ↓
Checks interaction type
        ├─→ isChatInputCommand?
        │        ↓
        │   client.commands.get(commandName)
        │        ↓
        │   command.execute(interaction)
        │        ↓
        │   Perform business logic
        │        ↓
        │   interaction.reply()
        │
        └─→ isAutocomplete?
                 ↓
            command.autocomplete(interaction)
                 ↓
            Query database/API
                 ↓
            interaction.respond(choices)
```

### Twitch Event Processing

```
Twitch event occurs (cheer, gift, redemption, etc.)
        ↓
Twitch EventSub sends webhook to bot
        ↓
eventSubListener receives event
        ↓
Subscription handler executes
        ├─→ cheerSubscription: Record in Bits table
        ├─→ giftSubscription: Record in Gifts table
        ├─→ onlineSubscription: Post to Discord
        └─→ redemptionSubscription:
                 ↓
            Check if user already redeemed this month
                 ├─→ Yes: Cancel redemption
                 └─→ No: Record in Rewards table
                          ↓
                     Update Discord lottery message
                          ↓
                     Fetch all month's redemptions
                          ↓
                     Sort alphabetically
                          ↓
                     Update message
```

### Voice State Change Flow

```
User joins/leaves voice channel
        ↓
Discord fires voiceStateUpdate event
        ↓
events/voiceStateUpdate.js
        ↓
Compare oldState.channelId vs newState.channelId
        ↓
If different:
    ├─→ Query VoiceRoleLink for old channel
    │        ↓
    │   Remove associated roles
    │
    └─→ Query VoiceRoleLink for new channel
             ↓
        Add associated roles
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│    Settings     │
│─────────────────│
│ config_id (PK)  │
│ guild_id (UQ)   │◄─────┐
│ reward_ch_id    │      │
│ reward_id       │      │
│ live_ch_id      │      │
│ twitch_id       │      │
│ cron_active     │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │
│ VoiceRoleLink   │      │
│─────────────────│      │
│ guild_id (CK)   │──────┘
│ vc_id (CK)      │
│ role_ids        │
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│      Bits       │      │      Gifts      │
│─────────────────│      │─────────────────│
│ id (PK)         │      │ id (PK)         │
│ user_id         │      │ user_id         │
│ amount          │      │ amount          │
│ broadcaster_id  │      │ broadcaster_id  │
│ createdAt       │      │ createdAt       │
│ updatedAt       │      │ updatedAt       │
└─────────────────┘      └─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│    Rewards      │      │    Messages     │
│─────────────────│      │─────────────────│
│ id (PK)         │      │ id (PK)         │
│ user_id         │      │ guild_id        │
│ broadcaster_id  │      │ channel_id      │
│ won             │      │ message_id      │
│ createdAt       │      │ name            │
│ updatedAt       │      │ done            │
└─────────────────┘      │ createdAt       │
                         │ updatedAt       │
                         └─────────────────┘

┌─────────────────┐
│  TwitchAuth     │
│─────────────────│
│ id (PK)         │
│ access_token(UQ)│
│ refresh_token(UQ)│
│ expires_in      │
│ obtainment_ts   │
│ scope[]         │
│ user_id (UQ)    │
└─────────────────┘

Legend:
PK = Primary Key
UQ = Unique
CK = Composite Key (part of unique constraint)
```

### Indexing Strategy

**Existing Indexes** (auto-created by Sequelize):
- Primary keys on all tables (id)
- Unique indexes:
  - `Settings.guild_id`
  - `VoiceRoleLink.(guild_id, voice_channel_id)` composite
  - `TwitchAuth.access_token`
  - `TwitchAuth.refresh_token`
  - `TwitchAuth.user_id`

**Recommended Additional Indexes** (not implemented):
```sql
-- Improve date-range queries
CREATE INDEX idx_bits_created ON bits(broadcaster_id, "createdAt");
CREATE INDEX idx_gifts_created ON gifts(broadcaster_id, "createdAt");
CREATE INDEX idx_rewards_created ON rewards(broadcaster_id, "createdAt");

-- Improve user lookups
CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_messages_guild ON messages(guild_id, done);
```

## Design Patterns

### Module Pattern
Each command, event, and subscription is a self-contained module that exports a standard interface:

```javascript
module.exports = {
    name: 'moduleName',
    // ... other properties
    async execute(...args) { }
}
```

### Dynamic Loading Pattern
Handlers use filesystem reads to dynamically load modules:

```javascript
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    client.commands.set(command.data.name, command);
}
```

**Benefits**:
- Easy to add new commands (just create file)
- No central registration needed
- Hot-reload friendly (could be implemented)

### Repository Pattern (via ORM)
Database access is abstracted through Sequelize models:

```javascript
// Instead of raw SQL
const settings = await Settings.findOne({ 
    where: { guild_id: guildId } 
});
```

### Observer Pattern
EventSub subscriptions follow observer pattern:

```javascript
listener.onChannelCheer(userId, async (event) => {
    // React to event
});
```

### Strategy Pattern
Different subscription strategies based on configuration:

```javascript
if (settings.reward_id) {
    // Specific reward subscription
    subscription = await listener.onChannelRedemptionAddForReward(...);
} else {
    // Generic redemption subscription
    subscription = await listener.onChannelRedemptionAdd(...);
}
```

## Authentication & Authorization

### Multi-Level Auth System

```
┌─────────────────────────────────────────────────────┐
│                  Bot Application                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  App-Level Auth (EventSub Listener)                │
│  ├─ App Token (client credentials)                 │
│  ├─ Used for: EventSub webhooks                    │
│  └─ Scopes: Minimal (just webhook management)      │
│                                                     │
│  User-Level Auth (API Client)                      │
│  ├─ User OAuth tokens (authorization code flow)    │
│  ├─ Used for: API calls (bits, redemptions, etc.)  │
│  └─ Scopes: channel:read:redemptions, bits:read... │
│                                                     │
│  Bot Token (Discord)                               │
│  ├─ Bot token                                      │
│  └─ Used for: Discord API operations               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### OAuth Flow (Twitch)

```
1. User runs /twitch-connect
        ↓
2. Bot provides OAuth URL with:
   - client_id
   - redirect_uri
   - response_type=code
   - scope
        ↓
3. User authorizes on Twitch
        ↓
4. Twitch redirects to callback URL with code
        ↓
5. [External OAuth server exchanges code for tokens]
        ↓
6. Tokens stored in TwitchAuth table
        ↓
7. authSubscriber.onUserAuthorizationGrant fires
        ↓
8. Bot adds user to auth provider
        ↓
9. User subscriptions created
```

**Note**: The OAuth callback server is not included in this codebase and must be implemented separately.

### Token Refresh Mechanism

```javascript
RefreshingAuthProvider({
    onRefresh: async (userId, newTokenData) => {
        // Automatically called when token expires
        await TwitchAuth.update({
            access_token: newTokenData.accessToken,
            expires_in: newTokenData.expiresIn,
            obtainment_timestamp: newTokenData.obtainmentTimestamp
        }, { where: { user_id: userId } });
    }
});
```

**Token Lifecycle**:
1. User authorizes → tokens saved to DB
2. Bot uses tokens for API calls
3. Token expires (after ~4 hours)
4. RefreshingAuthProvider automatically refreshes
5. New token saved to DB via onRefresh callback
6. Continue using new token

## Scalability Considerations

### Current Limitations

| Aspect | Limitation | Impact |
|--------|-----------|---------|
| Database Sync | Uses `sequelize.sync()` instead of migrations | Can't track schema changes, risky in production |
| Single Process | No clustering or load balancing | Limited to one CPU core, single point of failure |
| In-Memory State | Some state in client.subs Collection | Lost on restart, no horizontal scaling |
| Hardcoded Values | Streamer name, URLs, etc. hardcoded | Not multi-tenant friendly |
| Error Handling | Basic console.log error handling | No structured logging or monitoring |

### Scaling Strategies

#### Horizontal Scaling (Multiple Instances)

**Current Blockers**:
- In-memory subscription collection (`client.subs`)
- No distributed lock for cron jobs
- EventSub webhooks tied to single instance

**Solutions**:
1. **Sharding**: Use Discord.js sharding to split guilds across instances
2. **Redis**: Move subscription state to Redis
3. **Leader Election**: Use Redis or database for cron job coordination
4. **Load Balancer**: Distribute EventSub webhooks across instances

#### Vertical Scaling (More Resources)

**Current Resource Usage**:
- Low CPU (mostly I/O bound)
- Moderate memory (depends on # of guilds)
- Network I/O for API calls

**Optimization Opportunities**:
- Batch database operations
- Cache frequently accessed settings
- Use connection pooling for database
- Implement request throttling for APIs

### Performance Optimization

#### Database Query Optimization

**Current Issues**:
```javascript
// N+1 query problem
for (const redemption of redemptions) {
    userIds.push(redemption.user_id);
}
const users = await authClient.users.getUsersByIds(userIds); // Better

// Instead of:
for (const redemption of redemptions) {
    const user = await authClient.users.getUserById(redemption.user_id); // Slow
}
```

**Implemented Optimizations**:
- Aggregation in database (SUM for gifts/bits)
- Batch user fetches (getUsersByIds)
- Date filtering at database level (EXTRACT)

#### Caching Strategy (Not Implemented)

**Recommended Cache Layers**:
```javascript
// Level 1: In-memory (short TTL)
const settingsCache = new Map();

// Level 2: Redis (medium TTL)
// Level 3: Database (permanent)

// Example:
async function getSettings(guildId) {
    // Check L1 cache
    if (settingsCache.has(guildId)) {
        return settingsCache.get(guildId);
    }
    
    // Check L2 cache (Redis)
    // ...
    
    // Hit database
    const settings = await Settings.findOne({ where: { guild_id: guildId } });
    
    // Populate caches
    settingsCache.set(guildId, settings);
    
    return settings;
}
```

## Error Handling & Resilience

### Current Error Handling

**Command Execution**:
```javascript
try {
    command.execute(interaction);
} catch (error) {
    console.error(error);
    await interaction.reply('There was an error!', { ephemeral: true });
}
```

**Voice Role Assignment**:
```javascript
try {
    await memberRoles.add(voiceRoles);
} catch (e) {
    console.log('Rolle über der Rolle des Bots');
    // Fails silently, doesn't retry
}
```

### Recommended Improvements

#### Structured Logging
```javascript
// Instead of console.log
const winston = require('winston');

logger.error('Failed to assign role', {
    guildId: guild.id,
    userId: user.id,
    roleId: role.id,
    error: error.message,
    stack: error.stack
});
```

#### Retry Logic
```javascript
async function withRetry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(delay * Math.pow(2, i)); // Exponential backoff
        }
    }
}
```

#### Circuit Breaker Pattern
```javascript
class CircuitBreaker {
    constructor(threshold, timeout) {
        this.threshold = threshold;
        this.timeout = timeout;
        this.failures = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }
    
    async execute(fn) {
        if (this.state === 'OPEN') {
            throw new Error('Circuit breaker is OPEN');
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failures = 0;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
        }
    }
    
    onFailure() {
        this.failures++;
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            setTimeout(() => {
                this.state = 'HALF_OPEN';
            }, this.timeout);
        }
    }
}
```

## Monitoring & Observability

### Recommended Metrics

**Application Metrics**:
- Command execution count/latency
- Event processing count/latency
- Database query count/latency
- API call count/rate limits
- Error rate by type

**Business Metrics**:
- Active guilds
- Monthly lottery participants
- Redemptions per month
- Voice role assignments
- Stream notifications sent

### Recommended Monitoring Tools

- **Sentry**: Error tracking and performance monitoring
- **DataDog**: Full-stack observability
- **Prometheus + Grafana**: Custom metrics and dashboards
- **Heroku Metrics**: Built-in for Heroku deployments

## Security Architecture

### Threat Model

**Assets**:
- Discord bot token (full bot access)
- Twitch OAuth tokens (user data access)
- Database credentials (all data access)
- Webhook secret (EventSub verification)

**Threats**:
- Token theft → Unauthorized bot actions
- SQL injection → Data breach (mitigated by ORM)
- XSS/CSRF → OAuth flow compromise
- DDoS → Service unavailability
- Man-in-the-middle → Token interception

### Security Controls

**Implemented**:
- Environment variables for secrets
- HTTPS for OAuth redirects
- Webhook signature verification
- Sequelize parameterized queries
- Ephemeral responses for sensitive data

**Recommended Additions**:
- Secrets encryption at rest (AWS KMS, HashiCorp Vault)
- Rate limiting on commands
- Input validation and sanitization
- CSRF tokens in OAuth flow
- Audit logging for admin actions
- Regular dependency updates (npm audit)

## Testing Strategy (Not Implemented)

### Recommended Test Pyramid

```
         ┌────────────┐
         │    E2E     │  ← 10% - Full integration tests
         └────────────┘
       ┌──────────────────┐
       │   Integration    │  ← 30% - API and DB tests
       └──────────────────┘
    ┌───────────────────────┐
    │      Unit Tests       │  ← 60% - Function-level tests
    └───────────────────────┘
```

### Test Examples

**Unit Test**:
```javascript
describe('ticketsMessage.fetchData', () => {
    it('should return top gifter for given month', async () => {
        // Mock database
        // Mock API client
        const result = await fetchData(mockClient, { month: 1, year: 2024 }, '123');
        expect(result.topGifter.displayName).toBe('TestUser');
    });
});
```

**Integration Test**:
```javascript
describe('voicelink command', () => {
    it('should create voice role link', async () => {
        // Set up test guild
        // Create mock interaction
        await voiceLinkCommand.execute(mockInteraction);
        // Verify database entry
        const link = await VoiceRoleLink.findOne({...});
        expect(link.role_ids).toBe('123456789');
    });
});
```

## Future Architecture Considerations

### Microservices Architecture

Potential service breakdown:
- **Bot Service**: Discord interactions
- **API Service**: REST API for settings/data
- **EventSub Service**: Twitch webhook handling
- **Scheduler Service**: Cron jobs and batch operations
- **Auth Service**: OAuth flow handling

### Event-Driven Architecture

Use message queue (RabbitMQ, SQS) for async processing:
```
Discord Event → Queue → Worker → Database
Twitch Event → Queue → Worker → Discord
```

**Benefits**:
- Decoupled services
- Better fault tolerance
- Easier horizontal scaling
- Replay capability

### Multi-Tenancy

Support multiple streamers/communities:
- Add broadcaster context to all operations
- Isolate data by broadcaster_id
- Dynamic configuration per guild
- Separate EventSub subscriptions per broadcaster

---

## Conclusion

This bot follows a **monolithic, event-driven architecture** that works well for small to medium deployments. For larger scale:

1. Implement caching layer
2. Add structured logging and monitoring
3. Introduce migrations for database changes
4. Consider microservices for independent scaling
5. Implement comprehensive testing
6. Add security hardening

The current architecture prioritizes **simplicity and maintainability** over maximum scale, which is appropriate for a community Discord bot.

---

*For specific implementation details, refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md)*
