# Skillshare Docs Update Instructions

*One running file for every `docs/new_skills/*.md` update across the
project, instead of a separate instructions file per session.*

---

## Session 1: git recovery + positional arguments

**`git-branching-workflow.md` (updated)** - added a "Recovering when a
commit lands on the wrong branch" section, covering the actual cherry-pick +
multi-file stash situation with the `note.js` commit, plus the PowerShell
`@{}` quoting gotcha discovered while running `git stash pop`.

**`positional-arguments-and-silent-mismatches.md` (new file)** - documents
the `scheduleReminder( reminder )` vs `scheduleReminder( client, reminder, db )`
bug from the DCB-28 `index.js` fix: calling a function with the wrong number
of arguments doesn't error in JavaScript, it silently shifts everything and
produces `undefined`s, which then crash somewhere else with a confusing
message.

**Files:** `docs/new_skills/git-branching-workflow.md` (replaces existing),
`docs/new_skills/positional-arguments-and-silent-mismatches.md` (new)

---

## Session 2: bot permissions + regex whitespace (Slowmode)

**`discord-slash-commands.md` (updated)** - two new sections:
1. "The bot needs its own permissions, separate from the user's" - the
   `DiscordAPIError[50013]` bug from `/slowmode`, where the user's
   permission check passed but the bot's own role lacked Manage Channels.
2. "Testing permission-gated commands needs a second, lower-permission
   account" - why the dummy `HadnetS` account was necessary, and why some
   permissions (Manage Messages) grant an automatic bypass that can make a
   broken restriction look like it's working.

**`regex-whitespace-is-literal.md` (new file)** - the `SLOWMODE_TOKEN_REGEX`
bug where retyping the pattern added spaces around the alternation for
readability, silently changing the pattern's meaning, since regex has no
"ignore whitespace" mode in JavaScript.

**Files:** `docs/new_skills/discord-slash-commands.md` (replaces existing),
`docs/new_skills/regex-whitespace-is-literal.md` (new)

---

## Session 3: ID reuse (SQLite)

**`sqlite-setup-and-schema.md` (updated)** - new "Reusing IDs instead of
always incrementing" section: the "find the first gap" SQL query used by
`idReuser.js`, why explicitly providing an ID bypasses `AUTOINCREMENT`
entirely (so no schema change was needed), and why the synchronous nature of
`better-sqlite3` makes this safe without extra locking.

**File:** `sqlite-setup-and-schema.md` (existing file, was missing from
`docs/new_skills/` entirely until this session, see commit instructions
below for correct placement)

---

## Commit instructions (all sessions, not yet committed)

```
git add docs/new_skills/git-branching-workflow.md docs/new_skills/positional-arguments-and-silent-mismatches.md docs/new_skills/discord-slash-commands.md docs/new_skills/regex-whitespace-is-literal.md docs/new_skills/env-files-and-dotfile-gotchas.md docs/new_skills/stored-vs-computed-values.md
git commit -m "Documented wrong-branch recovery, positional arguments, bot permissions, and regex whitespace bugs"
```

**Note on `sqlite-setup-and-schema.md`'s location:** it's currently sitting
at the project root, not inside `docs/new_skills/` alongside the other five.
Move it in before committing, so all six live in the same place:

```
mv sqlite-setup-and-schema.md docs/new_skills/sqlite-setup-and-schema.md
git add docs/new_skills/sqlite-setup-and-schema.md
git commit -m "Added sqlite-setup-and-schema.md to new_skills, including ID reuse notes"
```

---

## Going forward

New entries get added as a new dated section above, in this same file,
rather than a new standalone instructions file each time. Keeps the whole
history of doc changes in one place instead of scattered across separate
one-off files.
