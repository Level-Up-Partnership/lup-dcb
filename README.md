# DCB - Discord Chatbot

An everyday Discord bot for reminders, note-taking, and finding server information.

## Status

✅ All in-scope features implemented, automated tests passing. Ready for client review.

## Features

- **Bot Setup & Slash Commands** - connects to Discord, all interactions via slash commands
- **Set a Reminder** (`/remind set`) - persists to the database, survives a bot restart
- **List & Cancel Reminders** (`/reminders`, `/remind cancel`) - shown as a Discord embed
- **Server Info** (`/serverinfo`) - member count, creation date, owner, channels, roles
- **Notes** (`/note save`, `/note list`, `/note delete`) - shown as a Discord embed, shifts position on delete
- **Slow Mode Toggle** (`/slowmode`) - Manage Channels permission required

## Tech stack

- Node.js + [discord.js](https://discord.js.org)
- SQLite (`better-sqlite3`)
- Local machine hosting

## Setup

1. Clone the repo and run `npm install`
2. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID`
3. Register slash commands with Discord: `node src/deploy-commands.js`
4. Start the bot: `node src/index.js`

## Testing

Run `npm test` to execute the full automated test suite (Jest): unit tests for the
time/slowmode parsers and the ID-reuse logic, plus integration tests for Notes and
Reminders CRUD and the reminder scheduler, against a real in-memory SQLite table.

## New skills demonstrated

1. **Discord API / bot framework + slash commands** - all six features implemented
   as slash commands with subcommands where needed, registered via `discord.js`.
2. **Automated testing** - Jest unit tests for pure logic (time/slowmode parsing,
   gap-filling ID reuse) and integration tests exercising real command execution
   against a live SQLite table (Notes CRUD, Reminders CRUD, reminder scheduling
   with fake timers), not just placeholder tests.

## License

Personal coursework/portfolio project. Not licensed for reuse.
