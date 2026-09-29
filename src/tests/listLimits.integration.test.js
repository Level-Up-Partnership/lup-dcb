const Database = require( 'better-sqlite3' );
const { MAX_ITEMS_PER_USER } = require( '../utils/userLimits' );

let db;
let reminders;
let remind;
let note;

beforeEach( () => {

    jest.resetModules(); // fresh module cache so each require picks up this test's mock DB

    db = new Database( ':memory:' ); // RAM-only DB, never touches dcb.sqlite

    db.exec( `

        CREATE TABLE reminders ( id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, message TEXT NOT NULL, fireAt INTEGER NOT NULL );
        CREATE TABLE notes ( id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, text TEXT NOT NULL );

    ` );

    jest.doMock( '../database', () => db );

    reminders = require( '../commands/reminders' );
    remind = require( '../commands/remind' );
    note = require( '../commands/note' );

} );

afterEach( () => {

    db.close();

} );


/**
 *
 * Builds a fake interaction with just the parts the commands under test use.
 *
 * @param { { subcommand: string, strings: Object } } options
 * @returns { Object } - object shaped like a Discord interaction, with reply captured by a mock.
 *
 */

function fakeInteraction( { subcommand = null, strings = {} } = {} ) {

    return {

        user: { id: 'user-1' },
        client: {},
        options: {

            getSubcommand: () => subcommand,
            getString: ( name ) => strings[ name ],
            getInteger: () => null

        },
        reply: jest.fn().mockResolvedValue()

    };

}


/**
 *
 * Inserts rows directly, bypassing the commands - simulates data that predates the cap.
 *
 * @param { string } table - 'reminders' or 'notes'.
 * @param { number } count - how many rows to insert.
 * @returns { void }
 *
 */

function insertRows( table, count ) {

    // Index only used to give each row distinct text
    for ( let i = 0; i < count; i++ ) {

        // Check reminders
        if ( table === 'reminders' ) {

            db.prepare( 'INSERT INTO reminders ( userId, message, fireAt ) VALUES ( ?, ?, ? )' ).run( 'user-1', `reminder ${ i }`, Date.now() + 60000 ); // one minute ahead, so it counts as pending

        } else { // notes

            db.prepare( 'INSERT INTO notes ( userId, text ) VALUES ( ?, ? )' ).run( 'user-1', `note ${ i }` );

        }

    }

}

test( '/reminders shows 25 with a footer when 26 exist', async () => {

    insertRows( 'reminders', MAX_ITEMS_PER_USER + 1 );

    const interaction = fakeInteraction();
    await reminders.execute( interaction );

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;

    expect( embed.fields ).toHaveLength( MAX_ITEMS_PER_USER );
    expect( embed.footer.text ).toContain( `${ MAX_ITEMS_PER_USER + 1 }` );

} );

test( '/remind set is rejected at the cap and saves nothing', async () => {

    insertRows( 'reminders', MAX_ITEMS_PER_USER );

    const interaction = fakeInteraction( { subcommand: 'set', strings: { time: '5m', message: 'one too many' } } );
    await remind.execute( interaction );

    const { count } = db.prepare( 'SELECT COUNT( * ) AS count FROM reminders' ).get();

    expect( interaction.reply.mock.calls[0][0].content ).toContain( 'at most' );
    expect( count ).toBe( MAX_ITEMS_PER_USER );

} );

test( '/note list shows 25 with a footer when 26 exist', async () => {

    insertRows( 'notes', MAX_ITEMS_PER_USER + 1 );

    const interaction = fakeInteraction( { subcommand: 'list' } );
    await note.execute( interaction );

    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;

    expect( embed.fields ).toHaveLength( MAX_ITEMS_PER_USER );
    expect( embed.footer.text ).toContain( `${ MAX_ITEMS_PER_USER + 1 }` );

} );

test( '/note save is rejected at the cap and saves nothing', async () => {

    insertRows( 'notes', MAX_ITEMS_PER_USER );

    const interaction = fakeInteraction( { subcommand: 'save', strings: { text: 'one too many' } } );
    await note.execute( interaction );

    const { count } = db.prepare( 'SELECT COUNT( * ) AS count FROM notes' ).get();

    expect( interaction.reply.mock.calls[0][0].content ).toContain( 'at most' );
    expect( count ).toBe( MAX_ITEMS_PER_USER );

} );
