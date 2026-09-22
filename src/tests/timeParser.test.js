const { parseTimeToMinutes, MAX_REMINDER_MINUTES } = require( '../utils/timeParser' );


describe( 'parseTimeToMinutes', () => {

    // Valid single-unit inputs
    test( 'parses a plain minutes value', () => {

        const result = parseTimeToMinutes( '30m' );

        expect( result.valid ).toBe( true );
        expect( result.minutes ).toBe( 30 );

    } );

    test( 'parses a plain hours value', () => {

        const result = parseTimeToMinutes( '2h' );

        expect( result.valid ).toBe( true );
        expect( result.minutes ).toBe( 120 );

    } );

    // Combined units - the exact bug shape documented in this project's own regex notes
    test( 'parses combined hours and minutes', () => {

        const result = parseTimeToMinutes( '1h30m' );

        expect( result.valid ).toBe( true );
        expect( result.minutes ).toBe( 90 );

    } );

    // Boundary checks, matching MIN/MAX_REMINDER_MINUTES from timeParser.js
    test( 'rejects below the minimum allowed time', () => {

        expect( parseTimeToMinutes( '0m' ).valid ).toBe( false );

    } );

    test( 'rejects above the maximum allowed time', () => {

        expect( parseTimeToMinutes( `${ MAX_REMINDER_MINUTES + 1 }m` ).valid ).toBe( false );

    } );

    // No partial credit - the whole string is rejected if any part isn't recognized
    test( 'rejects unrecognized text entirely', () => {

        expect( parseTimeToMinutes( '30 minutes and a banana' ).valid ).toBe( false );

    } );

    test( 'rejects missing input', () => {

        expect( parseTimeToMinutes( '' ).valid ).toBe( false );

    } );

} );
