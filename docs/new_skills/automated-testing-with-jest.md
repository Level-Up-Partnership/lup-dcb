# Automated Testing With Jest - How DCB Did It

## What "automated testing" actually means

Before this project, "testing" meant manually running `/note save` in
Discord and eyeballing whether it looked right. Automated testing means
writing separate code whose *only* job is to run your real code and check
the result, so a computer verifies correctness in seconds instead of a
human clicking through the bot by hand every time something changes.

There are two flavors used in this project, and they answer two different
questions:

- **Unit tests** ask: "does this one function, in isolation, do the right
  thing?" No database, no Discord, just a function and its return value.
- **Integration tests** ask: "does this feature actually work end to end,
  the way a real user would trigger it?" This touches a real database
  (a temporary one, never the production file) and calls the actual
  command code, not a simplified stand-in for it.

Both matter. Unit tests catch broken logic fast and pinpoint exactly which
function broke. Integration tests catch the things unit tests can't, like
two correct-looking pieces not fitting together correctly once wired up.

## Setting up Jest, from zero

Jest is a test *runner*: it finds files matching a naming pattern, executes
them, and reports pass/fail. Getting it running took three steps, no
config file needed:

```
npm install --save-dev jest
```

Then in `package.json`, the placeholder test script:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

became:

```json
"test": "jest"
```

That's it. Jest automatically looks for files named `*.test.js` anywhere
in the project and runs them when you type `npm test`.

## A unit test, the simplest case

`timeParser.js` has a function, `parseTimeToMinutes`, that takes a string
like `"1h30m"` and returns `{ valid: true, minutes: 90 }`. It doesn't touch
a database or Discord at all, pure input in, output out, which makes it
the easiest possible thing to test:

```javascript
const { parseTimeToMinutes } = require( '../utils/timeParser' );

test( 'parses combined hours and minutes', () => {

    const result = parseTimeToMinutes( '1h30m' );

    expect( result.valid ).toBe( true );
    expect( result.minutes ).toBe( 90 );

} );
```

`test()` names the case in plain English. `expect(...).toBe(...)` is the
actual check, if the value on the left doesn't match the value on the
right, the test fails and Jest prints exactly what it expected versus what
it got.

**The pattern to copy:** for any function that takes an input and returns
an output with no side effects (no database write, no network call), write
one `test()` per meaningfully different input: a normal case, a boundary
case (the smallest/largest allowed value), and a clearly invalid case. That
's usually 3-5 tests per function and catches almost everything.

## An integration test, and the one trick that makes it possible

Testing `/note save`, `/note list`, and `/note delete` for real means
calling the actual command code, the same `execute()` function Discord
itself calls. The problem: that code has `const db = require('../database')`
baked into it, which normally points at the real `dcb.sqlite` file. Tests
absolutely cannot be allowed to write into the real production database,
that would corrupt real data and make tests interfere with each other.

The fix is **mocking**: telling Jest "whenever this file asks for
`../database`, hand it a different, temporary database instead," without
changing a single line of the actual command code:

```javascript
const Database = require( 'better-sqlite3' );

beforeEach( () => {

    jest.resetModules(); // wipe Jest's module cache so requires are fresh

    const db = new Database( ':memory:' ); // a temporary DB that lives only in RAM

    db.exec( `CREATE TABLE notes ( id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, text TEXT );` );

    jest.doMock( '../database', () => db ); // redirect the real file's require() call

    note = require( '../commands/note' ); // NOW require it, so it picks up the mock

} );
```

`:memory:` tells `better-sqlite3` to create a database that exists only in
RAM and vanishes the moment the test finishes, real SQL, real tables, real
inserts and deletes, just never touching a file on disk. Running this
`beforeEach` before every single test means each test gets a completely
fresh, empty database, so tests can never leak state into each other.

From there, the test calls the real command exactly like Discord would:

```javascript
test( 'save inserts a note for the calling user', async () => {

    await note.execute( fakeInteraction( 'save', { text: 'take out the trash' } ) );

    const row = db.prepare( 'SELECT * FROM notes WHERE userId = ?' ).get( 'user-1' );

    expect( row.text ).toBe( 'take out the trash' );

} );
```

The only new piece is `fakeInteraction`, a small helper that builds an
object shaped like a real Discord interaction (with `.options.getString()`,
`.user.id`, `.reply()`) but is really just a plain JavaScript object the
test controls completely, including capturing whatever the command tries
to reply with, so the test can check it.

**The pattern to copy:** for any feature that reads or writes a database,
mock the database module to a fresh in-memory copy per test, then call the
real command function, never a rewritten copy of its logic. If you're
testing the real thing's actual behavior, not a simplified imitation of it.

## Testing things that happen "later" - fake timers

`reminderScheduler.js` uses `setTimeout` to fire a reminder in the future.
A real test can't sit around waiting 30 real minutes to check that it
fired. Jest's fake timers solve this by letting a test fast-forward time
on command:

```javascript
beforeEach( () => {

    jest.useFakeTimers();

} );

test( 'fires once its delay has elapsed', async () => {

    scheduleReminder( fakeClient, reminder, fakeDb );

    await jest.advanceTimersByTimeAsync( 1000 ); // pretend 1 second just passed

    expect( sendMock ).toHaveBeenCalled();

} );
```

`jest.useFakeTimers()` intercepts every `setTimeout` call so nothing real
timer-related actually runs on its own. `advanceTimersByTimeAsync` then
jumps the clock forward by however many milliseconds the test asks for, and
resolves any promises that were waiting on that time passing, all in real
time measured in milliseconds, not minutes.

**The pattern to copy:** anywhere your code schedules something to happen
later (`setTimeout`, `setInterval`), use fake timers instead of either
waiting for real time to pass or skipping the test entirely.

## How to set this up on a brand new project, step by step

1. `npm install --save-dev jest`, change `package.json`'s `"test"` script to `"jest"`.
2. Create a folder for tests (this project used `src/tests/`), any name works as long as files end in `.test.js`.
3. For pure functions (no I/O): write direct `test()` blocks calling the function and checking its return value.
4. For anything touching a database: mock the database module to a fresh in-memory instance in a `beforeEach`, then call the real feature's actual entry point, never a rewritten copy of its logic.
5. For anything using `setTimeout`/`setInterval`: `jest.useFakeTimers()` in `beforeEach`, `jest.useRealTimers()` in `afterEach`, and `jest.advanceTimersByTimeAsync(ms)` instead of waiting.
6. Run `npm test`. Read every failure message before assuming the test itself is wrong, a failing test is usually telling you something true about the code.
