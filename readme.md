# Discord Bot for the Hylian Family Discord

A feature-rich Discord bot with Twitch integration for managing community events, voice channel roles, and monthly lottery systems.

## 🎯 Current Features

### Voice Channel Management
- **Voice <-> Channel Linking**: Automatically assigns users a role when they join specific voice channels
- Supports multiple roles per voice channel
- Automatic role removal when leaving channels

### Twitch Integration
- **Stream Notifications**: Automatic announcements when the streamer goes live
- **Bits Tracking**: Records and tracks bit cheers to the broadcaster
- **Subscription Gift Tracking**: Monitors and records subscription gifts
- **Channel Points Lottery**: Monthly lottery system using channel point redemptions
- **OAuth Connection**: Users can link their Twitch accounts to Discord

### Monthly Lottery System
- Automatic lottery message creation at the start of each month
- Real-time participant list updates as users redeem tickets
- Top gifter and top cheerer recognition
- Winner selection with admin commands
- Automatic finalization of previous month's results

### Administration
- Comprehensive slash commands for managing all features
- Manual override options for correcting data
- Message reload functionality to refresh statistics
- Autocomplete support for user-friendly command usage

## 📚 Documentation

Comprehensive documentation is available covering all aspects of the bot:

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference for all commands, functions, and modules
- **[Setup Guide](SETUP_GUIDE.md)** - Step-by-step instructions for setting up and deploying the bot
- **[Commands Reference](COMMANDS_REFERENCE.md)** - Quick reference guide for all Discord commands
- **[Architecture](ARCHITECTURE.md)** - Technical overview of the system architecture and design patterns
- **[Troubleshooting](TROUBLESHOOTING.md)** - Solutions for common issues and debugging tips

## 🚀 Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables** (see [SETUP_GUIDE.md](SETUP_GUIDE.md)):
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Initialize database**:
```bash
node dbInit.js
```

4. **Deploy commands**:
```bash
node deploy-commands.js YOUR_GUILD_ID
```

5. **Start the bot**:
```bash
npm run startBot
```

For detailed setup instructions, see the [Setup Guide](SETUP_GUIDE.md).

## 🔧 Technology Stack

- **Discord.js v14** - Discord API integration
- **Twurple** - Twitch API and EventSub
- **Sequelize** - PostgreSQL ORM
- **Node-cron** - Scheduled tasks
- **PostgreSQL** - Database

## 📋 Available Commands

- `/help` - Display available commands
- `/twitch-connect` - Connect Twitch account
- `/voicelink add` - Link role to voice channel
- `/voicelink delete` - Remove voice channel link
- `/reload-message` - Refresh lottery message
- `/update-bits` - Manually set top cheerer
- `/update-gifter` - Manually set top gifter
- `/select-a-winner` - Choose lottery winner

See [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md) for detailed usage.

## 🔒 Required Permissions

### Discord Bot Permissions
- Manage Roles
- Send Messages
- Embed Links
- Use Slash Commands
- Read Message History
- Mention Everyone
- View Channels
- Connect (Voice)

### Twitch Scopes
- `channel:read:redemptions`
- `bits:read`
- `channel:read:subscriptions`

## 📦 Deployment

The bot can be deployed to Heroku or any Node.js hosting platform.

### Heroku Quick Deploy
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:standard-0
heroku config:set DISCORD_TOKEN=your_token
# ... set other environment variables
git push heroku main
heroku run node dbInit.js
```

For detailed deployment instructions, see the [Setup Guide](SETUP_GUIDE.md).

## 🐛 Troubleshooting

Having issues? Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for solutions to common problems:
- Bot connection issues
- Command problems
- Database errors
- Twitch integration issues
- Voice role link problems

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- All functions are documented
- Environment variables are not hardcoded
- Changes are tested locally before submitting

## 📄 License

[Specify license here]

## 🆘 Support

For help with setup or usage:
1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the [API Documentation](API_DOCUMENTATION.md)
3. Check service status pages (Discord, Twitch, Heroku)
4. Review application logs

## 🔄 Version History

- **v1.0.0** - Initial release
  - Voice channel role linking
  - Twitch integration
  - Monthly lottery system
  - Stream notifications
  - OAuth authentication

---

*For detailed information about any feature, please refer to the comprehensive documentation files listed above.*
