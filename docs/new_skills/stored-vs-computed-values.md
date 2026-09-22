# Stored vs. Computed Values

This is the single most important concept behind the Reminders feature,
and the one that took the most back-and-forth to actually nail down. It
generalizes way beyond reminders, so it's worth having written down
properly.

## The core question

For any piece of time-related (or generally changing) data: **would
writing this value down once and reading it back later still be true and
useful?**

- If yes, it belongs in the database. It's a **stored field**.
- If the value goes stale the instant time passes, it must be
  **computed live**, every time it's needed, and never saved anywhere.

## The analogy that made it click

- **A calendar appointment**, "Dentist, Tuesday 3:00 PM." Written once,
  doesn't change, sits there whether anyone's looking at it or not. This
  is `fireAt`, the exact timestamp a reminder should go off. Calculated
  once when `/remind set` runs, saved to the database, never recalculated.

- **A clock on the wall**, tells you something different every time you
  glance at it. You'd never write down "the clock says 2:47" and treat it
  as permanently true. This is `Date.now()` / `new Date()`, always
  computed fresh, in the moment, **never stored** in a database column.

## Why this matters specifically for bot restarts

When a Node process restarts, nothing "pauses", the process dies
completely. Every variable, every in-memory timer, gone. The only thing
that survives is whatever was explicitly written to disk (the SQLite DB).

- **Storing a duration** (`"30m"`) is useless after a restart, it only
  meant something relative to *when the bot originally read it*. There's
  no way to know how much of that 30 minutes had already elapsed.
- **Storing the calculated fire timestamp** (`fireAt`) survives a restart
  cleanly, because it's an absolute point in time. On startup, the bot
  just asks the DB "what timestamps are still in the future?" and
  re-schedules from there, the restart itself is irrelevant to the math.

## How to apply it going forward

Before adding any new field to a table, ask: **is this a fact that gets
written once and stays true, or is it something that's only accurate in
the instant it's calculated?** If it's the second kind, it doesn't belong
in the schema, it belongs in a formula, computed on demand
(e.g. `timeRemaining = fireAt - Date.now()`).

This is also a live lesson in **not inventing unscoped fields**. It was
tempting to add a `startTimestamp` column "just in case," reasoning that
more data must be more useful. It wasn't needed anywhere in the actual
feature requirements (Section 4 of the Scope Lock), and time spent
building unscoped fields is time taken directly from a deadline that was
already tight.
