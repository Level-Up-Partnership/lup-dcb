# Git Branching Workflow - Branch per Story, Commit per Subtask

## The structure

- **One branch per Jira Story** (not per Epic, not per Subtask, that's
  too coarse and too fine, respectively). Branch name format:
  `feature/dcb-<ticket-number>-<short-description>`, e.g.
  `feature/dcb-14-slash-command-registration`.
- **One commit per Subtask** inside that branch. Each commit message
  describes one complete, coherent unit of work, not a mid-thought
  snapshot.
- **One Pull Request per Story**, opened once every Subtask inside it is
  committed, then merged into `main`.

## Why not branch per Subtask?

A project can easily have 25-40 Subtasks. Branching at that granularity
creates dozens of branches for a small bot, and turns the repo's history
into merge noise instead of a readable story. A Subtask like "return a
clear error for an invalid id" is a few lines inside a larger change,
not something that needs its own isolated branch and merge.

## The actual command sequence

```
git checkout main
git pull
git checkout -b feature/dcb-<n>-<description>

# ... do the work for one subtask, then:
git add <specific files>
git commit -m "<past-tense description of what changed>"

# repeat add/commit for each subtask in the story

# first push from a new branch needs -u to link it to the remote:
git push -u origin feature/dcb-<n>-<description>

# every push after that on this branch is just:
git push
```

## Opening and merging the PR

Once all the story's commits are pushed, GitHub prints a direct PR link
in the terminal output after `git push`. Title the PR with the ticket
number and name (e.g. "DCB-14: Bot Setup & Slash Commands"), write a
short description of what it covers, then merge.

**Before branching for the next piece of work**, always return to `main`
and pull first:

```
git checkout main
git pull
```

This keeps every new branch starting from the latest merged state,
instead of branching off a stale copy of `main`.

## Commit message tense

Pick one tense and stay consistent, this project uses **past tense**
("Added," "Registered," "Fixed") rather than imperative present
("Add," "Register," "Fix"). Either is a valid convention; consistency
matters more than which one is chosen.

## Hygiene check before every commit

Run `git status` before `git add`, not after. Catch two kinds of
problems before they become part of the commit:

1. **Files that shouldn't be tracked at all** (stray 0-byte files, leftover
   artifacts from an interrupted command), investigate and delete rather
   than committing blindly.
2. **Files that belong to a different, unrelated piece of work** (e.g. a
   `.excalidraw` wireframe file sitting in the same folder as code changes),
   these get their own branch and commit, not swept in accidentally via
   a broad `git add .`.

## Recovering when a commit lands on the wrong branch

This happened for real on DCB: a `/note` command file got committed while
still parked on the reminders branch (`feature/dcb-25-remind-set-scheduling`),
instead of its own Notes branch. Two different situations, two different
fixes, depending on whether the wrong-branch work was already committed.

### If it's already committed, and it's the most recent commit

Use `git cherry-pick` to replay that one commit onto the correct branch, then
remove it from the wrong one. This only works cleanly when the commit is the
tip of the branch (nothing after it), since `git reset --hard HEAD~1` rewinds
the branch by exactly one commit.

```
git log --oneline -5              # find and copy the commit's short hash
git reset --hard HEAD~1           # removes that commit from the current (wrong) branch
git checkout main
git pull
git checkout -b feature/<correct-branch-name>
git cherry-pick <the hash you copied>
```

`git reset --hard` also wipes any *uncommitted* changes sitting in the working
directory, not just the targeted commit, so if there's other unrelated work
in progress at the same time, stash it first (see below) or it's gone.

### If it's still uncommitted, and other unrelated changes are also uncommitted

This is the messier, more realistic case: multiple unrelated changes sitting
in the working directory at once, only one of which belongs on a different
branch. `git stash push` can target specific files by listing them after `--`,
so each set of changes can be stashed and moved independently instead of
lumped together.

```
git stash push -m "describe this set" -- path/to/fileA.js path/to/fileB.js
git stash push -m "describe the other set"     # everything else remaining, uncommitted

git stash list      # confirm stash@{0} and stash@{1} are what's expected before touching either
```

Then branch fresh, pop the *relevant* stash by its `stash@{N}` reference (not
just `git stash pop`, which always grabs the newest one), commit it there, and
go back for the rest:

```
git checkout main
git pull
git checkout -b feature/<correct-branch-name>
git stash pop "stash@{0}"        # quotes matter in PowerShell, see below
git add <files>
git commit -m "..."

git checkout feature/<original-wrong-branch>
git stash pop "stash@{0}"        # index shifts down to 0 once the first stash is gone
```

**PowerShell quoting gotcha:** `git stash pop stash@{0}` (no quotes) fails in
PowerShell with `error: unknown switch 'e'`, because PowerShell parses `@{`
as the start of its own hashtable syntax and mangles the argument before git
ever sees it. Wrapping the whole reference in quotes, `"stash@{0}"`, forces
PowerShell to treat it as a literal string. Command Prompt doesn't have this
problem, since it doesn't have hashtable syntax to collide with, another
entry in the running list of "PowerShell and cmd aren't the same shell."

### When it's not worth the cleanup

Not every wrong-branch commit needs surgery. If the branch has already been
pushed and might get force-push complications, or the change is genuinely
low-risk (comment-only edits, no logic), it can be left in place and just
called out honestly in the PR title/description instead. Save the cherry-pick
effort for cases where the branch's history would otherwise misrepresent what
Story it actually covers.
