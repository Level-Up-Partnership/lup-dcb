const slowmode = require( '../commands/slowmode' );


/**
 *
 * Builds a minimal fake interaction for /slowmode, with a configurable
 * permission check and duration option.
 *
 * @param { string } duration - e.g. '10s', '1m', or 'off'.
 * @param { boolean } hasPermission - Whether the user has the Manage Channels permission.
 * @returns { Object } - Fake interaction, plus getReply()/getRateLimitCall() helpers.
 *
 */

function fakeInteraction( duration, hasPermission = true ) {

    let lastReply = null;
    const setRateLimitPerUser = jest.fn().mockResolvedValue( undefined );

    return {

        user: { tag: 'TestUser#0001' },
        member: { permissions: { has: () => hasPermission } },
        channel: { setRateLimitPerUser },
        options: { getString: () => duration },
        reply: async ( payload ) => { lastReply = payload; },
        getReply: () => lastReply,
        getRateLimitCall: () => setRateLimitPerUser.mock.calls[ 0 ]

    };

}

/**
 * 
 * This test suite verifies the behavior of the slowmode command, ensuring that it correctly
 *  handles permission checks, duration parsing, and slowmode setting.
 * 
 */
describe( 'slowmode command', () => {

    test( 'rejects a user without Manage Channels permission', async () => {

        const interaction = fakeInteraction( '10s', false );

        await slowmode.execute( interaction );

        expect( interaction.getReply().content ).toMatch( /Manage Channels permission/ );
        expect( interaction.getRateLimitCall() ).toBeUndefined();

    } );

    // Test that an invalid duration format is rejected with an appropriate error message
    test( 'rejects an invalid duration format', async () => {

        const interaction = fakeInteraction( 'not a real duration' );

        await slowmode.execute( interaction );

        expect( interaction.getReply().content ).toMatch( /Could not understand/ );
        expect( interaction.getRateLimitCall() ).toBeUndefined();

    } );

    // Test that a valid duration is parsed and applied correctly, with confirmation sent to the user
    test( 'sets slowmode to the parsed duration and confirms it', async () => {

        const interaction = fakeInteraction( '10s' );

        await slowmode.execute( interaction );

        expect( interaction.getRateLimitCall()[ 0 ] ).toBe( 10 );
        expect( interaction.getRateLimitCall()[ 1 ] ).toMatch( /TestUser#0001/ );
        expect( interaction.getReply() ).toBe( 'Slowmode set to 10 seconds for this channel.' );

    } );

    // Test that 'off' disables slowmode and sends a confirmation message
    test( "disables slowmode via 'off' and confirms with the disabled message", async () => {

        const interaction = fakeInteraction( 'off' );

        await slowmode.execute( interaction );

        expect( interaction.getRateLimitCall()[ 0 ] ).toBe( 0 );
        expect( interaction.getReply() ).toBe( 'Slowmode disabled for this channel.' );

    } );

} );
