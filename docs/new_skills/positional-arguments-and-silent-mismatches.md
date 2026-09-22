# Positional Arguments and Silent Mismatches

## What happened on DCB-28

`reminderScheduler.js` defines `scheduleReminder( client, reminder, db )`,
three parameters, in that order. Early versions of the restart-rescheduling
code in `index.js` called it as `scheduleReminder( reminder )`, one argument.

JavaScript doesn't check this. It doesn't error, doesn't warn, doesn't
complain about a missing argument count. It just quietly does this instead:

- `client` (the function's first parameter) receives whatever was passed
  first, the `reminder` object
- `reminder` (the function's second parameter) receives nothing, so it's
  `undefined`
- `db` (the third parameter) is also `undefined`

The very first line inside `scheduleReminder` reads `reminder.fireAt`, so
this crashed immediately with a `TypeError`, reading a property off
`undefined`, the moment the function ran. Not a slow leak, an instant crash,
but the *reason* for the crash (wrong argument, not a missing property) isn't
obvious from the error message alone.

## Why this is worth knowing generally

JavaScript functions don't enforce argument count or type by default. Calling
a function with too few, too many, or wrongly-ordered arguments is completely
legal syntax, it will run, and whatever parameters didn't get a matching
argument are simply `undefined`. This is different from many other languages
that throw a compile-time or immediate runtime error for an arity mismatch.

**How to catch it before it becomes a crash:** when calling a function that
takes multiple parameters, especially ones with generic names like `client`,
`data`, or `options`, check the function's own definition (or its JSDoc
`@param` list) for the exact parameter count and order, don't rely on memory
or assume a shorter call "still basically works." A JSDoc block correctly
documenting `@param { Client } client`, `@param { Object } reminder`,
`@param { Database } db` is exactly what would have made this mismatch
obvious at a glance, the docstring was correct here, the call site just
didn't match it.

**How to apply it going forward:** when a bug's crash message points at a
property read (`Cannot read properties of undefined (reading 'fireAt')`),
don't assume the object itself is missing or empty upstream, check whether
the object arrived in the right *parameter slot* in the first place. An
argument-count mismatch and a genuinely missing value produce the exact same
symptom.
