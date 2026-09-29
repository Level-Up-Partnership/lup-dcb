# DCB - Discord Chatbot

An everyday Discord bot for reminders, note-taking, and finding server information. Every feature runs through Discord's native slash commands, and reminders and notes are stored in SQLite, so they survive a bot restart.

## Status

Feature-complete. Grace-period fixes from the first client review are merged; second review pending.

## Features

| Command | What it does |
| --- | --- |
| `/remind set time:<duration> message:<text>` | DMs you a reminder after the given time. Accepts minutes and hours, e.g. `30m`, `1h`, `1h30m`, `2 hours`. Minimum 1 minute, maximum 24 hours. |
| `/remind cancel id:<id>` | Cancels one of your pending reminders before it fires. |
| `/reminders` | Lists your pending reminders with their IDs and when they fire. Only you can see the reply. |
| `/note save text:<text>` | Saves a personal note. |
| `/note list` | Lists your saved notes by position (#1, #2, ...). Only you can see the reply. |
| `/note delete position:<number>` | Deletes the note at that position in your list. |
| `/serverinfo` | Posts an embed with the server's name, member count, creation date, owner, and channel and role counts. |
| `/slowmode duration:<duration>` | Sets slow mode on the current channel, e.g. `10s`, `1m`, `2h`, or `off`. Requires the Manage Channels permission. Maximum 6 hours (Discord's own limit). |

**Limits:** each user can have at most 25 pending reminders and 25 saved notes (Discord embeds display at most 25 fields), and reminder messages and note text are capped at 100 characters.

## Tech stack

- [Node.js](https://nodejs.org) + [discord.js](https://discord.js.org) (v14)
- SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [dotenv](https://github.com/motdotla/dotenv) for environment variables
- [Jest](https://jestjs.io) for unit and integration tests
- Hosted on a local machine: the bot is online only while `node src/index.js` is running

## New skills demonstrated

1. **Discord API / bot framework + slash commands**: command registration through Discord's REST API, interaction handling, embeds, and permission checks.
2. **Automated testing**: Jest unit tests for pure logic (time and slowmode parsing, limits, error handling) and integration tests that run the real command code against an in-memory SQLite database.

Write-ups of what was learned along the way live in `docs/new_skills/`.

---

# Setting up the bot on your own machine

This takes about 15 minutes the first time. You need three things from Discord (a bot token, the application ID, and your server's ID), and the bot has to be invited to a server you manage.

## 1. Install the prerequisites

- **Node.js 18 or newer.** The LTS version from [nodejs.org](https://nodejs.org) is recommended. Check with `node -v`.
- **Git.** Check with `git --version`.
- **A Discord server you can manage.** Any server where you have the Manage Server permission works. Creating a fresh test server takes one click (the **+** at the bottom of Discord's server list).

## 2. Get the code

```
git clone https://github.com/Level-Up-Partnership/lup-dcb.git
cd lup-dcb
npm install
```

The repository is private. You need to be added to it before cloning will work.

`npm install` also builds `better-sqlite3`, which includes native code. It normally downloads a prebuilt version automatically. If it fails with a compiler error, see [Troubleshooting](#troubleshooting).

## 3. Create the Discord application and bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and log in.
2. Click **New Application**, give it a name (e.g. `DCBot`), accept the terms, and click **Create**.
3. On the **General Information** page, copy the **Application ID**. This is your `DISCORD_CLIENT_ID`.
4. Open the **Bot** tab in the left sidebar.
5. Click **Reset Token**, confirm, and copy the token that appears. This is your `DISCORD_TOKEN`. Discord only shows it once, so paste it somewhere safe right away. If you lose it, reset it again.

**Privileged Gateway Intents** (also on the Bot tab): leave all three switched off. This bot only uses the basic `Guilds` intent, which needs no special approval.

> **Treat the token like a password.** Anyone with it can control your bot. Never commit it, paste it in a chat, or put it in a screenshot. If it ever leaks, click **Reset Token** immediately, which instantly invalidates the old one.

## 4. Get your server's ID

Discord hides IDs until Developer Mode is on:

1. In Discord, open **User Settings** (the gear next to your username).
2. Go to **Advanced** and switch on **Developer Mode**.
3. Close settings, right-click your server's icon in the server list, and click **Copy Server ID**. This is your `DISCORD_GUILD_ID`.

## 5. Invite the bot to your server

Registering commands (step 7) only tells Discord what the bot's commands are. The bot also has to be a member of the server, or Discord rejects everything with `Missing Access`.

1. Back in the Developer Portal, open **OAuth2** in the left sidebar, then **URL Generator**.
2. Under **Scopes**, check:
   - `bot`
   - `applications.commands`
3. A **Bot Permissions** section appears below. Check:
   - **View Channels**: to see the channels commands are used in
   - **Send Messages**: to reply to commands
   - **Embed Links**: for the `/serverinfo`, `/reminders`, and `/note list` embeds
   - **Manage Channels**: required for `/slowmode` to actually change a channel's slow mode
4. Copy the **Generated URL** at the bottom, open it in your browser, pick your server, and click **Authorize**.

The bot now appears in your server's member list (offline until you start it in step 8).

**Check the bot's role.** Inviting the bot creates a role with the same name. Open **Server Settings → Roles**, find that role, and confirm **Manage Channels** is switched on. A user having Manage Channels does *not* give the bot that permission; they're separate. If a channel has its own permission overrides, check them too, since a channel-level override can block the bot even when its server-wide role allows the action.

## 6. Create your `.env` file

The project reads its secrets from a `.env` file in the project root, which is gitignored and never committed. A template with empty values, `.env.example`, is committed. Copy it:

| Shell | Command |
| --- | --- |
| macOS / Linux terminal | `cp .env.example .env` |
| Windows PowerShell | `Copy-Item .env.example .env` |
| Windows Command Prompt | `copy .env.example .env` |

Then open `.env` and fill in the three values from steps 3 and 4:

```
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
DISCORD_GUILD_ID=your-server-id
```

No quotes and no spaces around the `=`.

## 7. Register the slash commands

```
node src/deploy-commands.js
```

You should see `Successfully registered application (/) commands with Discord.` Commands are registered to the one server in `DISCORD_GUILD_ID`, so they show up almost instantly.

You only need to run this again when a command's definition changes (its name, options, or descriptions in `src/commands/definitions.js`). Starting the bot does not re-register commands.

## 8. Start the bot

Run this **from the project root**:

```
node src/index.js
```

You should see `DCB Bot online as <BotName>#1234`, and the bot turns green in your server's member list. Type `/` in any channel to see its commands.

The SQLite database (`dcb.sqlite`) is created automatically in the folder you run the command from, the first time the bot starts. That's why the root matters: running it from anywhere else quietly creates a separate, empty database.

To stop the bot, press **Ctrl + C** in the terminal (on macOS too, it's Ctrl, not Cmd). The bot is only online while this terminal process is running.

## 9. Make sure reminders can reach you

Reminders are delivered by direct message. If your Discord privacy settings block DMs from server members, the reminder is removed when it fires, but the message never arrives.

To allow them: right-click the server icon → **Privacy Settings** → turn on **Direct Messages**.

## Running the tests

```
npm test
```

Jest finds every `*.test.js` file under `src/tests/`. Integration tests use an in-memory SQLite database, so running them never touches `dcb.sqlite`.

---

## Project structure

```
src/
├── commands/
│   ├── definitions.js       # Slash command shapes (names, options, limits)
│   ├── remind.js            # /remind set, /remind cancel
│   ├── reminders.js         # /reminders
│   ├── note.js              # /note save, list, delete
│   ├── serverinfo.js        # /serverinfo
│   └── slowmode.js          # /slowmode
├── utils/
│   ├── timeParser.js        # "1h30m" → minutes, with validation
│   ├── slowmodeParser.js    # "10s" / "off" → seconds, with validation
│   ├── idReuser.js          # Reuses the smallest free reminder ID
│   ├── userLimits.js        # Per-user caps and embed display trimming
│   └── errorReply.js        # Error replies that can never crash the bot
├── tests/                   # Jest unit and integration tests
├── database.js              # Shared SQLite connection
├── schema.js                # Creates tables on startup if missing
├── reminderScheduler.js     # Schedules, fires, and cancels reminder timers
├── deploy-commands.js       # Registers slash commands with Discord
└── index.js                 # Entry point: connects, reschedules reminders, routes commands
docs/
└── new_skills/              # Notes on what was learned building this
```

---

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| `Missing DISCORD_TOKEN in .env` | The `.env` file is missing, misnamed, or in the wrong folder. It must be named exactly `.env` and sit in the project root. |
| `DiscordAPIError[50001]: Missing Access` when registering commands | The bot hasn't been invited to the server in `DISCORD_GUILD_ID`, or that ID is wrong. Redo step 5, and recopy the server ID from step 4. |
| `DiscordAPIError[50013]: Missing Permissions` from `/slowmode` | The **bot's role** lacks Manage Channels, or a channel override blocks it. See "Check the bot's role" in step 5. |
| Slash commands don't appear when typing `/` | Rerun `node src/deploy-commands.js`, then reload Discord (Ctrl + R on Windows, Cmd + R on macOS). |
| "The application did not respond" | The bot isn't running. Check the terminal. If it's back at a prompt, start it again with `node src/index.js`. |
| Reminders never arrive | DMs from server members are blocked. See step 9. |
| `/reminders` or `/note list` is empty after restarting | The bot was started from a different folder, so it created a new, empty `dcb.sqlite`. Stop it and start again from the project root. |
| `npm install` fails while building `better-sqlite3` | No prebuilt binary matched your system, so it tried to compile. On macOS, install Apple's build tools with `xcode-select --install`. On Windows, install "Desktop development with C++" through the Visual Studio Installer. Then run `npm install` again. |
| Can't find `.env` or `.env.example` in Finder (macOS) | Files starting with a dot are hidden. Press **Cmd + Shift + .** in Finder to show them, or use the terminal. |
| `.env` turned into `env` on Windows | Some Windows rename and download flows strip the leading dot. Rename it from a terminal: `Rename-Item env .env` (PowerShell). |
