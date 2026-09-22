const { parseSlowmodeDuration } = require( '../utils/slowmodeParser' );


describe( 'parseSlowmodeDuration', () => {

    test( 'parses seconds', () => {

        const result = parseSlowmodeDuration( '10s' );

        expect( result.valid ).toBe( true );
        expect( result.seconds ).toBe( 10 );

    } );

    test( 'parses minutes', () => {

        expect( parseSlowmodeDuration( '1m' ).seconds ).toBe( 60 );

    } );

    test( 'parses hours', () => {

        expect( parseSlowmodeDuration( '2h' ).seconds ).toBe( 7200 );

    } );

    // "off" is a special case per slowmodeParser.js - means disable, not a duration
    test( 'treats "off" as zero seconds, case-insensitive', () => {

        expect( parseSlowmodeDuration( 'off' ).seconds ).toBe( 0 );
        expect( parseSlowmodeDuration( 'OFF' ).seconds ).toBe( 0 );

    } );

    // Discord's own 6-hour (21600s) ceiling for setRateLimitPerUser
    test( "rejects durations above Discord's 6-hour ceiling", () => {

        expect( parseSlowmodeDuration( '7h' ).valid ).toBe( false );

    } );

    test( 'rejects an unrecognized format', () => {

        expect( parseSlowmodeDuration( '10 bananas' ).valid ).toBe( false );

    } );

    test( 'rejects missing input', () => {

        expect( parseSlowmodeDuration( '' ).valid ).toBe( false );

    } );

} );
