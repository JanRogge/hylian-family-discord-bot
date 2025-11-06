# Commands Quick Reference

A quick lookup guide for all Discord bot commands.

## User Commands

### `/help`
**Description**: Shows all available commands or info about a specific command  
**Usage**: `/help [command]`  
**Examples**:
- `/help` - List all commands
- `/help voicelink` - Show details about voicelink command

**Permissions**: All users

---

### `/twitch-connect`
**Description**: Get a link to connect your Twitch account  
**Usage**: `/twitch-connect`  
**Returns**: Button with OAuth link to Twitch

**Permissions**: All users

---

## Admin Commands

### `/voicelink add`
**Description**: Link a role to the voice channel you're in  
**Usage**: `/voicelink add role:@RoleName`  
**Requirements**:
- Must be in a voice channel
- Bot must have "Manage Roles" permission
- Bot's role must be higher than the role being assigned

**Example**: `/voicelink add role:@Stream Watchers`

**Permissions**: Admins only (default permission: false)

---

### `/voicelink delete`
**Description**: Remove a role link from the voice channel you're in  
**Usage**: `/voicelink delete role:@RoleName`  
**Requirements**:
- Must be in a voice channel
- Voice link must exist

**Example**: `/voicelink delete role:@Stream Watchers`

**Permissions**: Admins only (default permission: false)

---

### `/reload-message`
**Description**: Refresh a lottery message with current data  
**Usage**: `/reload-message monat-jahr:MonthYear`  
**Parameters**:
- `monat-jahr`: Month and year (autocomplete available)

**Example**: `/reload-message monat-jahr:Januar 2024`

**What it does**:
- Fetches latest Twitch data
- Updates top gifter and cheerer
- Refreshes participant list
- Maintains winner status if set

**Permissions**: Admins only

---

### `/update-bits`
**Description**: Manually set the top cheerer for a month  
**Usage**: `/update-bits monat-jahr:MonthYear user:Username`  
**Parameters**:
- `monat-jahr`: Month and year (autocomplete)
- `user`: Twitch username

**Example**: `/update-bits monat-jahr:Januar 2024 user:CoolViewer123`

**Use cases**:
- Correct tracking errors
- Manual overrides
- Special circumstances

**Permissions**: Admins only

---

### `/update-gifter`
**Description**: Manually set the top gifter for a month  
**Usage**: `/update-gifter monat-jahr:MonthYear user:Username`  
**Parameters**:
- `monat-jahr`: Month and year (autocomplete)
- `user`: Twitch username

**Example**: `/update-gifter monat-jahr:Januar 2024 user:GenerousGifter`

**Use cases**:
- Correct tracking errors
- Manual overrides
- Special circumstances

**Permissions**: Admins only

---

### `/select-a-winner`
**Description**: Choose and mark the lottery winner for a month  
**Usage**: `/select-a-winner monat-jahr:MonthYear user:Username`  
**Parameters**:
- `monat-jahr`: Month and year (autocomplete, only shows incomplete months)
- `user`: Twitch username (autocomplete, shows participants only)

**Example**: `/select-a-winner monat-jahr:Januar 2024 user:LuckyWinner99`

**What it does**:
- Updates the Discord message with winner marked
- Sets the month as "done" in database
- Marks the user's redemption as won
- Winner displayed as: *Username (Winner)*

**Important**: Once a winner is selected, the month cannot be changed through this command (use database or `/update-gifter`/`/update-bits` to modify)

**Permissions**: Admins only

---

## Command Permissions Setup

To restrict admin commands to specific roles:

1. Go to Server Settings → Integrations
2. Find your bot
3. Click on a command
4. Configure roles/channels that can use it

Default permissions in code:
- `/help`: Everyone
- `/twitch-connect`: Everyone  
- `/voicelink`: Admins only (`setDefaultPermission(false)`)
- `/reload-message`: Everyone (should be restricted via Discord settings)
- `/update-bits`: Everyone (should be restricted via Discord settings)
- `/update-gifter`: Everyone (should be restricted via Discord settings)
- `/select-a-winner`: Everyone (should be restricted via Discord settings)

**Recommended**: Configure admin commands through Discord's integration settings for better security.

---

## Autocomplete Fields

Several commands provide autocomplete for easier use:

### Month-Year Autocomplete
Commands: `/reload-message`, `/update-bits`, `/update-gifter`, `/select-a-winner`

**Shows**: List of existing lottery messages from the database  
**Format**: "Monat Jahr" (e.g., "Januar 2024")  
**Source**: Messages table

### User Autocomplete
Commands: `/update-bits`, `/update-gifter`, `/select-a-winner`

**Shows**: Relevant usernames based on context
- For `/select-a-winner`: Only users who redeemed tickets that month
- Fetched from: Twitch API user data

**Note**: Type the first few letters to filter results

---

## Command Workflows

### Setting Up Voice Roles
```
1. Join voice channel
2. /voicelink add role:@RoleName
3. Test: Have someone join the channel
4. Verify role is assigned
5. To remove: /voicelink delete role:@RoleName
```

### Running Monthly Lottery
```
1. Month begins: Cron creates message automatically
2. Users redeem tickets: Bot updates message in real-time
3. Month ends: Admin reviews entries
4. Admin runs: /select-a-winner monat-jahr:Januar 2024 user:WinnerName
5. Next month begins: Previous month finalized, new one created
```

### Correcting Data
```
Option 1: Reload from Twitch API
  /reload-message monat-jahr:Januar 2024

Option 2: Manual override
  /update-bits monat-jahr:Januar 2024 user:CorrectUsername
  /update-gifter monat-jahr:Januar 2024 user:CorrectUsername
```

---

## Command Responses

### Success Messages (German)
- "Voicelink was added..." - Voice link created
- "Voicelink was edited..." - Voice link updated
- "Voicelink was deleted..." - Voice link removed
- "Nachricht wurde neugeladen!" - Message reloaded
- "Bits wurde geändert!" - Bits winner changed
- "Gifter wurde geändert!" - Gifter changed
- "Gewinner wurde eingetragen!" - Winner selected

### Error Messages (German)
- "Du musst für diesen Befehl in gewünschten Voice Channel sein!" - Must be in voice channel
- "There is already a voicelink for this channel!" - Voice link exists
- "That's not a valid command!" - Invalid command in /help
- "Fehler kein Monat ausgewählt!" - No month selected

---

## Technical Details

### Command Registration
Commands are deployed per-guild using:
```bash
node deploy-commands.js GUILD_ID
```

This creates guild-specific slash commands that appear immediately (global commands can take up to 1 hour to propagate).

### Command Structure
```javascript
{
    data: SlashCommandBuilder,        // Command definition
    execute: async (interaction) => {},  // Handler function
    autocomplete: async (interaction) => {} // Optional autocomplete
}
```

### Response Types
- **Ephemeral**: Only visible to command user (most responses)
- **Public**: Visible to everyone (none in this bot)
- **Deferred**: For slow operations (not currently used)

---

## Frequently Asked Questions

**Q: Why don't my commands appear?**  
A: Run `node deploy-commands.js YOUR_GUILD_ID` to register them.

**Q: Can I use commands in DMs?**  
A: No, all commands require a guild context.

**Q: How do I remove a command?**  
A: Delete the command file and re-deploy, or use Discord API to delete.

**Q: Why is autocomplete not working?**  
A: Check database connection and ensure data exists for the field.

**Q: Can users see admin commands?**  
A: Yes, but they'll get an error if they don't have permission. Configure restrictions in Discord Server Settings.

**Q: How do I add a new command?**  
A: Create a new file in `/commands/`, implement the structure, and redeploy.

---

For detailed API information and implementation details, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
