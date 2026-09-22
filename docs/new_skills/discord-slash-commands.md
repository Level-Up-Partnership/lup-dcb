# Discord Slash Commands - How They Actually Work

## The subcommand constraint

Discord will not let a single top-level command mix flat options with
subcommands. You either pick one shape or the other:

- **Flat command:** `/serverinfo`, no branching, just runs.
- **Subcommand command:** `/remind set time:30m message:"Take a break"` /
  `/remind cancel id:3`, one parent name, multiple "modes" underneath.

This mattered directly on DCB: the Scope Lock Document was written as if
`/remind 30m Take a break` and `/remind cancel [id]` could coexist under
one command with no subcommand keyword. They can't. Any command with more
than one "mode" needs `.addSubcommand()` for each mode.

**How to apply it:** if a feature description has more than one usage
pattern for the same command name, that's the signal to reach for
subcommands from the start, don't find out partway through building.

## Builders vs. JSON, two different jobs, two different files

`SlashCommandBuilder` objects (from `discord.js`) are **not** what Discord's
API actually wants. They're JavaScript objects with methods attached
(`.setName()`, `.addStringOption()`, etc.), convenient to build with, but
Discord's REST API only accepts plain JSON.

That's what `.toJSON()` is for. Call it on each builder to convert it into
the flat data Discord expects:

```javascript
const commandsJSON = commands.map( ( command ) => command.toJSON() );
```

**Why `.map()` and not a loop:** `.map()` takes an array, runs a function on
every item, and returns a *new* array of the results, exactly the shape
needed here. Same pattern shows up constantly in React (`fetchedReminders.map(...)`),
just applied to a different kind of data.

**How to apply it:** keep command *definitions* (the builders, the shape)
separate from command *registration* (the REST call, the conversion to
JSON). One file owns "what the commands look like," another owns "how they
get sent to Discord." That split is why `definitions.js` and
`deploy-commands.js` are two files, not one.

## Guild-scoped vs. global registration

`Routes.applicationGuildCommands(clientId, guildId)` registers commands to
**one specific server**, and the change is visible almost instantly.

The alternative, global registration, makes commands available everywhere
the bot is installed, but can take up to an hour to propagate.

**How to apply it:** use guild-scoped registration during development
(fast iteration on your test server). Global registration is a
later-stage decision, once a bot is actually being deployed publicly.

## The bot has to be invited, registering commands isn't enough

Defining commands and registering them with Discord's API only tells
Discord *what the bot's commands should be*. It says nothing about which
servers the bot is actually a member of.

The real error hit on DCB: `DiscordAPIError[50001]: Missing Access`,
even though the registration code was correct, the bot had never been
invited into the test server, so Discord refused the request outright.

**How to apply it:** before troubleshooting registration code, check the
basics first: is the bot actually a member of the server you're testing
against? An OAuth2 invite URL (Developer Portal, OAuth2 tab, URL Generator,
with `bot` + `applications.commands` scopes checked) is a separate,
required step from writing any code.

## The bot needs its own permissions, separate from the user's

This one cost real debugging time on `/slowmode` (DCB-10): the command
correctly checked whether the *calling user* had Manage Channels
(`interaction.member.permissions.has(...)`), that check passed, the code
reached the actual API call, and Discord still rejected it with
`DiscordAPIError[50013]: Missing Permissions`.

The reason: `setRateLimitPerUser()` (and plenty of other actions, editing a
channel, adding a role to someone, deleting a message) requires the **bot's
own role** to have that same permission on the server. A user having
permission to do something doesn't mean the bot doing it *on their behalf*
automatically inherits that permission. They're two completely independent
checks, one enforced by code (`interaction.member.permissions.has(...)`),
one enforced by Discord's API itself regardless of what the code checks.

**How to apply it:** if a Discord API call throws a `Missing Permissions`
error (code `50013`) even though the acting user clearly has the right role,
don't assume the permission-check code is wrong. Check Server Settings →
Roles for the *bot's own role* first. A channel-level permission override
can also independently block the bot even if its server-wide role has the
permission granted, so check both levels if the server-wide role looks fine
and it's still failing.

## Testing permission-gated commands needs a second, lower-permission account

A command that's supposed to reject users without some permission can't be
properly tested from an account that already has admin-level access on the
test server, since that account will pass the check every time, proving
nothing about the rejection path. It also can't be verified indirectly (e.g.
"the settings panel shows the right value"), since some permissions grant an
automatic bypass of the very restriction being tested. A high-permission
account sending messages during a slowmode test, for instance, will look
identical whether slowmode is working correctly or completely broken,
because that account is exempt either way.

**How to apply it:** for any feature gated behind a permission check
(commands, role-based restrictions, anything with an "only X can do this"
requirement), test with two accounts on purpose: one with the permission,
one genuinely without it, in a role with no elevated bypasses. Confirm the
restricted account is actually, visibly blocked by the real feature (not
just that the bot's reply text says the right thing), not only that the
privileged account can still use it successfully.
