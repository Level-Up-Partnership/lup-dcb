const MAX_SLOWMODE_SECONDS = 21600; // 6 hours, Discord's own limit

// Matches a single number-unit pair, e.g., "10s", "1m", "2h", or "off" (case-insensitive)
const SLOWMODE_TOKEN_REGEX = /^(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)$/i;


/**
 * 
 * This function parses a slowmode duration string into seconds.
 * Accepts "off" (case-insensitive) to mean disable slowmode entirely.
 * It also rejects anything outside Discord's own 0-21600 second range for setRateLimitPerUser.
 * 
 * @param { string } durationString - Raw text from the duration option.
 * @returns { { valid: boolean, seconds: number, error: string } } - Seconds and error are mutually exclusive.
 * 
 */

function parseSlowmodeDuration( durationString ) {

    // Fail fast if input is missing or not a string
    if ( !durationString || typeof durationString !== 'string' ) {

        return { valid: false, error: 'Please provide a duration, like "10s", "1m", or "off".' };

    }

    const trimmed = durationString.trim();

    // "off" is a special case, meaning zero seconds, not a parsed duration
    if ( trimmed.toLowerCase() === 'off' ) {

        return { valid: true, seconds: 0 };

    }

    const match = trimmed.match( SLOWMODE_TOKEN_REGEX );

    // Reject anything that isn't exactly one number-unit pair or "off"
    if( !match ) {

        return { valid: false, error: 'Could not understand that duration. Try "10s", "1m", "2h", or "off".' };

    }

    const amount = parseInt( match[ 1 ], 10 );
    const unit = match[ 2 ].toLowerCase();

    let seconds;

    // Check hours
    if( unit.startsWith( 'h' ) ) {

        seconds = amount * 60 * 60;

    } else if( unit.startsWith( 'm' ) ) { // Check minutes

        seconds = amount * 60;

    } else { // Check seconds

        seconds = amount;

    }

    // Enforce Discord's own API ceiling
    if( seconds > MAX_SLOWMODE_SECONDS ) {

        return { valid: false, error: 'Slowmode can be at most 6 hours (21600 seconds), that\'s Discord\'s own limit.' };

    }

    return { valid: true, seconds };

}

module.exports = {
    
    parseSlowmodeDuration

};
