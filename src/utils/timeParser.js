const MIN_REMINDER_MINUTES = 1; // shortest allowed reminder - avoids instant/0-minute fires
const MAX_REMINDER_MINUTES = 24 * 60; // longest allowed reminder - avoids multi-day reminders that are likely to be forgotten

// Matches one number-unit pair, e.g. "1h", "30m", "2 hours" - the g flag lets matchAll find every occurrence
const TIME_TOKEN_REGEX = /(\d+)\s*(hours?|hrs?|h|minutes?|mins?|m)/gi;


/**
 *
 * Parses a /remind set time string into a total number of minutes.
 * Rejects the ENTIRE string if any part isn't recognized - no partial credit.
 *
 * @param { string } timeString - Raw text from the time option.
 * @returns { { valid: boolean, minutes: number, error: string } }
 *
 */

function parseTimeToMinutes( timeString ) {

    // Fail fast if input is missing or not a string
    if ( !timeString || typeof timeString !== 'string' ) {

        return { valid: false, error: 'Please provide a time, like "30m" or "1h".' };

    }

    let totalMinutes = 0;
    let matchedText = '';

    const matches = timeString.matchAll( TIME_TOKEN_REGEX );

    // Loop through all matches and accumulate the total minutes
    for ( const match of matches ) {

        const amount = parseInt( match[1], 10 );
        const unit = match[2].toLowerCase();

        // Check hours
        if ( unit.startsWith( 'h' ) ) {

            totalMinutes += amount * 60;

        } else { // Check minutes

            totalMinutes += amount;

        }

        matchedText += match[0];

    }

    // Reject if nothing matched at all
    if ( matchedText === '' ) {

        return { valid: false, error: 'Could not understand that time. Try "30m", "1h", or "1h30m".' };

    }

    // Reject if any leftover text wasn't part of a recognized pair
    const leftover = timeString.replace( TIME_TOKEN_REGEX, '' ).trim();

    // Reject if the total minutes is outside the allowed range
    if ( leftover !== '' ) {

        return { valid: false, error: `Could not understand "${ leftover }" in your time.` };

    }

    // Reject if the total minutes is outside the allowed range
    if ( totalMinutes < MIN_REMINDER_MINUTES ) {

        return { valid: false, error: 'Reminders must be at least 1 minute from now.' };

    }

    // Reject if the total minutes is outside the allowed range
    if ( totalMinutes > MAX_REMINDER_MINUTES ) {

        return { valid: false, error: 'Reminders can be at most 24 hours from now.' };

    }

    return { valid: true, minutes: totalMinutes };

}

module.exports = {
    
    parseTimeToMinutes, MIN_REMINDER_MINUTES, MAX_REMINDER_MINUTES

};
