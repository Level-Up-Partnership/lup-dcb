const { replyWithError } = require( '../utils/errorReply.js' );


/**
 *
 * Builds a fake interaction with controllable reply state and reply behaviour.
 *
 * @param { { replied: boolean, replyRejects: boolean } } options
 * @returns { Object } - object shaped like the parts of a Discord interaction replyWithError uses.
 *
 */

function fakeInteraction( { replied = false, replyRejects = false } = {} ) {

    return {

        replied,
        deferred: false,
        reply: replyRejects
            ? jest.fn().mockRejectedValue( new Error( 'Unknown interaction' ) )
            : jest.fn().mockResolvedValue(),
        followUp: jest.fn().mockResolvedValue()

    };

}

// Silence the expected console.error output from the catch block
beforeEach( () => {

    jest.spyOn( console, 'error' ).mockImplementation( () => {} );

} );

// Restore console.error after each test so other tests aren't affected
afterEach( () => {

    jest.restoreAllMocks();

} );

// Tests the replyWithError function's behaviour when no reply has been sent yet
test( 'replies when nothing has been sent yet', async () => {

    const interaction = fakeInteraction();

    await replyWithError( interaction );

    expect( interaction.reply ).toHaveBeenCalled();
    expect( interaction.followUp ).not.toHaveBeenCalled();

} );

// Tests the follow-up behaviour of the replyWithError function when a reply has already been sent
test( 'follows up when a reply was already sent', async () => {

    const interaction = fakeInteraction( { replied: true } );

    await replyWithError( interaction );

    expect( interaction.followUp ).toHaveBeenCalled();
    expect( interaction.reply ).not.toHaveBeenCalled();

} );


// Tests the replyWithError function's error handling when the reply itself fails
test( 'does not throw when the reply itself fails', async () => {

    const interaction = fakeInteraction( { replyRejects: true } );

    await expect( replyWithError( interaction ) ).resolves.toBeUndefined();

} );
