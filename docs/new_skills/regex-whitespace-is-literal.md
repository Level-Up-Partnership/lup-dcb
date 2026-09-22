# Regex Whitespace Is Literal, Not Decorative

## What happened on DCB-10

While retyping `slowmodeParser.js` by hand, the regex ended up as:

```javascript
/^(\d+)\s*( seconds? | secs? | s | minutes? | mins? | m | hours? | hrs? | h )$/i
```

instead of the intended:

```javascript
/^(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)$/i
```

The visual difference is tiny, spaces added around the `|` characters and
next to the parentheses, purely for readability while typing, the same
instinct that makes spacing out a long condition or a destructured object
feel more readable in ordinary code.

Regex doesn't work that way. Every character inside a pattern, including a
plain space, is something the pattern is trying to *match against the
actual input string*, not formatting for a human reader. There's no
whitespace-is-ignored mode active by default in JavaScript regex (some
regex engines have an optional flag for this, JavaScript's don't). So that
"readable" version was actually asking for a literal space character
immediately before and after every unit word, meaning `"10s"` (no spaces)
would never match at all, every legitimate input would silently fail
validation.

## Why this is easy to miss

The bug doesn't throw an error. It doesn't crash. It just makes every valid
input get rejected with the same "could not understand that duration"
message a genuinely invalid input would produce, so it looks like normal,
expected validation behavior unless the input is compared character by
character against the intended pattern. This is the same category of
"technically legal, does something different than intended" issue as the
positional-argument bug documented separately, code that runs without
complaint but doesn't do what it looks like it does.

## How to apply it going forward

When retyping or reformatting a regex pattern (rather than copy-pasting it
exactly), treat every character inside the pattern as significant, including
spaces, and resist the urge to add visual breathing room the way it's
natural to do in ordinary code. If a pattern genuinely needs to be more
readable, the safe way to add spacing is outside the pattern (a comment
above it explaining what it matches, like the ones already used in this
project's parser files) rather than inside it. When a validation function
starts rejecting input that looks obviously correct, comparing the actual
regex character-by-character against a known-working version is worth doing
before assuming the bug is somewhere else in the logic.
