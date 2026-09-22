# .env Files and Windows Dotfile Gotchas

## Why two files, not one

- **`.env`**, the real file, with real secrets (bot token, client ID,
  guild ID). Gitignored. Never committed, ever.
- **`.env.example`**, a template with the same variable names but empty
  values. This one *is* committed, so anyone cloning the repo knows what
  environment variables they need to fill in themselves.

Both get created on day one of a project, before a single API call is
written, not retrofitted later once something's already gone wrong.

## The Windows dotfile problem

Windows Explorer's rename dialog, and some file-download flows, will
sometimes strip the leading dot from a filename like `.gitignore` or
`.env.example`, silently turning it into `gitignore` or `env.example`.
This isn't a git problem or a code problem, it's a Windows Explorer /
download-handling quirk with filenames that start with a dot.

**Symptom to watch for:** `git add .gitignore` fails with "pathspec
'.gitignore' did not match any files", but a file named `gitignore`
(no dot) is sitting right there in the folder.

**Fix, from the terminal (not Explorer's rename box):**

```
ren gitignore .gitignore
```

**PowerShell equivalent (if `ren` doesn't behave as expected):**

```
Rename-Item gitignore .gitignore
```

**How to verify a rename actually worked**, since Windows Explorer can
also hide file extensions and *look* correct when it isn't:

```
dir /a          (Command Prompt)
Get-ChildItem -Force     (PowerShell)
```

Both flags/cmdlets force hidden and dotfile-prefixed files to actually
show up in the listing, which they won't with a plain `dir`.

## Command Prompt vs. PowerShell, they're not the same shell

`dir /a` works in Command Prompt (`cmd.exe`) but fails in PowerShell,
because PowerShell's `dir` is an alias for `Get-ChildItem`, which uses
different flag syntax entirely. Check the prompt prefix to know which
shell is active:

- `C:\Users\...>` means Command Prompt
- `PS C:\Users\...>` means PowerShell

**How to apply it:** when a command "should work" but throws a syntax
error about a path not existing, check which shell is running first,
it's often not a typo, it's the wrong shell's syntax.
