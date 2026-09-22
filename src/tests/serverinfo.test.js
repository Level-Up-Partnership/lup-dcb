const serverinfo = require( '../commands/serverinfo' );


/**
 * 
 * This function creates a fake interaction object that simulates a Discord interaction for testing purposes.
 * It includes a mock guild with predefined properties and methods, as well as methods to reply to the
 *  interaction and retrieve the last reply.
 * 
 * @returns - { Object } - Fake interaction, plus a getReply() helper.
 * 
 */

function fakeInteraction() {

    let lastReply = null;

    const guild = {

        name: 'Test Server',
        memberCount: 42,
        createdAt: new Date( '2026-01-01T00:00:00Z' ),
        iconURL: () => 'https://example.com/icon.png',
        fetchOwner: async () => ( { user: { tag: 'Owner#0001' } } ),
        channels: { cache: { size: 5 } },
        roles: { cache: { size: 8 } }

    };

    return {

        guild,
        reply: async ( payload ) => { lastReply = payload; },
        getReply: () => lastReply

    };

}

/**
 * 
 * This test suite verifies the behavior of the serverinfo command, ensuring that it correctly
 *  builds an embed with the expected server details.
 * 
 */

describe( 'serverinfo command', () => {

    test( 'builds an embed with the correct server details', async () => {

        const interaction = fakeInteraction();

        await serverinfo.execute( interaction );

        const embed = interaction.getReply().embeds[ 0 ];

        expect( embed.data.title ).toBe( 'Test Server' );

        const fieldMap = Object.fromEntries( embed.data.fields.map( ( field ) => [ field.name, field.value ] ) );

        expect( fieldMap[ 'Member Count' ] ).toBe( '42' );
        expect( fieldMap[ 'Creation Date' ] ).toBe( interaction.guild.createdAt.toDateString() );
        expect( fieldMap[ 'Owner' ] ).toBe( 'Owner#0001' );
        expect( fieldMap[ 'Channels' ] ).toBe( '5' );
        expect( fieldMap[ 'Roles' ] ).toBe( '8' );

    } );

} );
