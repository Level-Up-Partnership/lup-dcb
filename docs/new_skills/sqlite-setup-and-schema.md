# SQLite Setup and Schema Design

## No server, just a library

Unlike MySQL or PostgreSQL, SQLite is not a separate program running in the
background. There's no service to start, no server process, nothing sitting
in a system tray. `better-sqlite3` is a Node library that reads and writes
directly to a single file on disk (`dcb.sqlite`). Installing it via
`npm install better-sqlite3` is the entire setup.

**How to apply it:** if a project's database needs are small (a handful of
tables, low write volume, single-process access), SQLite avoids the setup
overhead of a real database server entirely. That's why it's the right fit
for DCB rather than PostgreSQL, even though PostgreSQL is worth learning as
a separate, personal skill later.

## Why `better-sqlite3` specifically, not `sqlite3`

`better-sqlite3` is synchronous — no callbacks, no promises needed for basic
queries. For a project this size, where every query is a small, fast lookup
(one user's reminders, one note), synchronous calls don't meaningfully block
anything, and the code stays much simpler than juggling `async/await` for
every database call.

## One shared connection, not one per file

`src/database.js` opens the connection once and exports it:

```javascript
const Database = require( 'better-sqlite3' );
const db = new Database( 'dcb.sqlite' );
module.exports = db;
```

`new Database( 'dcb.sqlite' )` either opens the file if it already exists,
or silently creates a new empty one if it doesn't. Every other file that
needs the database (`require( './database' )`, or `require( '../database' )`
depending on location) gets the exact same connection object back, rather
than each file opening its own.

## Raw SQL has to live inside a JS string, not as bare code

A `.js` file is parsed as JavaScript. Bare SQL keywords like `CREATE` are
not valid JavaScript syntax on their own and will throw a wall of syntax
errors. SQL statements need to be wrapped as **strings**, then handed to a
method that actually executes them:

```javascript
const db = require( './database' );

db.exec( `
    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        message TEXT NOT NULL,
        fireAt INTEGER NOT NULL
    );
` );
```

Backticks (template literals) are used rather than regular quotes because
the SQL needs to span multiple lines, which a normal `'...'` or `"..."`
string can't do directly.

## `INTEGER PRIMARY KEY AUTOINCREMENT`

The standard SQLite idiom for an auto-incrementing primary key column. Every
table in this project uses `id INTEGER PRIMARY KEY AUTOINCREMENT` as its
first column.

## Why `fireAt` is `INTEGER`, not `TEXT`

SQLite has no dedicated timestamp type, only `INTEGER`, `TEXT`, `REAL`,
`BLOB`, `NULL`. `Date.now()` in JavaScript already returns a plain number
(milliseconds since Jan 1 1970 UTC) rather than a formatted string, so
storing `fireAt` as `INTEGER` means it's already in the same format
`Date.now()` produces on the other side of any comparison.

This matters concretely: `fireAt <= Date.now()` (the scheduling loop's due
check) and `fireAt - Date.now()` (time remaining for `/reminders`) both work
as plain arithmetic if `fireAt` is stored as `INTEGER`. Storing it as `TEXT`
would require parsing the string back into a number every time, and string
comparison of dates only happens to work by coincidence of formatting, not
by design.

## `IF NOT EXISTS` makes schema setup safe to run on every startup

`CREATE TABLE IF NOT EXISTS` checks, on every single run, whether a table
with that name already exists. First run: it doesn't exist, so it gets
created. Every run after that: it already exists, so the statement does
nothing and moves on, no error, no data loss.

This is the opposite situation from Discord command registration
(`deploy-commands.js`), which is deliberately a separate, manually-run
script since re-registering the same commands repeatedly is wasteful API
spam. Schema setup has no such downside, so it's safe (and simpler) to
just `require( './schema' )` directly inside `index.js`, guaranteeing the
tables always exist before anything else tries to use them, with nothing
to remember to run manually.

## Verifying it worked, without writing a query

The "SQLite Viewer" VS Code extension opens a `.sqlite` file as a visual
table browser directly in the editor, click and see rows/columns, instead
of writing a `SELECT * FROM sqlite_master` query by hand every time you
want to sanity check the database's structure.

**Note:** a `sqlite_sequence` table appears automatically the moment any
table uses `AUTOINCREMENT`, it's SQLite's own internal bookkeeping table
for tracking the next available ID per table. Not something the project
creates explicitly, and not something to touch directly.
