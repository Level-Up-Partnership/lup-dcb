const Database = require( 'better-sqlite3' );


/**
 *
 * Builds a minimal fake Discord interaction, capturing whatever gets passed to
 * .reply() so tests can assert on it without a real Discord connection.
 *
 * @param { string } subcommand
 * @param { Object } options - e.g. { text: '...' } or { position: 2 }.
 * @param { string } userId
 * @returns { Object } - fake interaction, plus a getReply() helper.
 *
 */

function fakeInteraction( subcommand, options = {}, userId = 'user-1' ) {

    let lastReply = null;

    return {

        user: { id: userId },
        options: {

            getSubcommand: () => subcommand,
            getString: ( name ) => options[ name ],
            getInteger: ( name ) => options[ name ]

        },
        reply: async ( payload ) => { lastReply = payload; },
        getReply: () => lastReply

    };

}


describe( 'Notes CRUD (integration)', () => {

    let db;
    let note;

    // Fresh in-memory database and a fresh require of note.js for every test,
    // so no state leaks between tests and the real dcb.sqlite is never touched
    beforeEach( () => {

        jest.resetModules();

        db = new Database( ':memory:' );

        // Same shape as schema.js's notes table
        db.exec( `
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                text TEXT NOT NULL
            );
        ` );

        // Point note.js's db import at this in-memory database instead of the real file
        jest.doMock( '../database', () => db );

        note = require( '../commands/note' );

    } );

    afterEach( () => {

        db.close();

    } );

    test( 'save inserts a note for the calling user', async () => {

        await note.execute( fakeInteraction( 'save', { text: 'take out the trash' } ) );

        const row = db.prepare( 'SELECT * FROM notes WHERE userId = ?' ).get( 'user-1' );

        expect( row.text ).toBe( 'take out the trash' );

    } );

    test( "list returns only the calling user's notes, ordered by real id", async () => {

        await note.execute( fakeInteraction( 'save', { text: 'first' } ) );
        await note.execute( fakeInteraction( 'save', { text: 'second' } ) );

        // A different user's note should never show up in the first user's list
        await note.execute( fakeInteraction( 'save', { text: 'not mine' }, 'user-2' ) );

        const listInteraction = fakeInteraction( 'list' );
        await note.execute( listInteraction );

        const embed = listInteraction.getReply().embeds[ 0 ];

        expect( embed.data.fields ).toHaveLength( 2 );
        expect( embed.data.fields[ 0 ].name ).toBe( '#1' );
        expect( embed.data.fields[ 1 ].name ).toBe( '#2' );

    } );

    test( 'delete removes the note at the given position, shifting positions below it', async () => {

        await note.execute( fakeInteraction( 'save', { text: 'note1' } ) );
        await note.execute( fakeInteraction( 'save', { text: 'note2' } ) );
        await note.execute( fakeInteraction( 'save', { text: 'note3' } ) );

        // Delete position 1 ("note1") - "note2" should shift down to position 1
        await note.execute( fakeInteraction( 'delete', { position: 1 } ) );

        const listInteraction = fakeInteraction( 'list' );
        await note.execute( listInteraction );

        const embed = listInteraction.getReply().embeds[ 0 ];

        expect( embed.data.fields ).toHaveLength( 2 );
        expect( embed.data.fields[ 0 ].value ).toBe( 'note2' );
        expect( embed.data.fields[ 1 ].value ).toBe( 'note3' );

    } );

    test( 'delete rejects an out-of-range position without crashing', async () => {

        await note.execute( fakeInteraction( 'save', { text: 'only note' } ) );

        const deleteInteraction = fakeInteraction( 'delete', { position: 5 } );
        await note.execute( deleteInteraction );

        expect( deleteInteraction.getReply().content ).toMatch( /No note at position 5/ );

    } );

} );
