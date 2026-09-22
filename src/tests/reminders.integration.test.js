const Database = require( 'better-sqlite3' );


/**
 *
 * Builds a minimal fake Discord interaction, capturing whatever gets passed to
 * .reply() so tests can assert on it without a real Discord connection.
 *
 * @param { string } subcommand - e.g. 'set', 'list', or 'cancel'.
 * @param { Object } options - e.g. { time: '30m', message: '...' } or { id: 4 }.
 * @param { string } userId - e.g. 'user-1' or 'user-2'.
 * @returns { Object } - Fake interaction, plus a getReply() helper.
 *
 */

function fakeInteraction( subcommand, options = {}, userId = 'user-1' ) {

    let lastReply = null;

    // Minimal shape of a Discord interaction, just enough to exercise the command logic
    return {

        user: { id: userId },
        client: {}, // passed through to scheduleReminder, which is mocked below
        options: {

            getSubcommand: () => subcommand,
            getString: ( name ) => options[ name ],
            getInteger: ( name ) => options[ name ]

        },
        reply: async ( payload ) => { lastReply = payload; },
        getReply: () => lastReply

    };

}

// Integration tests for the reminders CRUD operations
describe( 'Reminders CRUD (integration)', () => {

    let db;
    let remind;
    let reminders;

    // Fresh in-memory database and fresh requires for every test, so no state
    // leaks between tests and the real dcb.sqlite is never touched
    beforeEach( () => {

        jest.resetModules();

        db = new Database( ':memory:' );

        // Same shape as schema.js's reminders table
        db.exec( `
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                message TEXT NOT NULL,
                fireAt INTEGER NOT NULL
            );
        ` );

        jest.doMock( '../database', () => db );

        // Scheduling/cancelling actual timers is covered separately in
        // reminderScheduler.test.js (DCB-68) - mocked here so this suite only
        // exercises the database CRUD logic, not real setTimeout behavior
        jest.doMock( '../reminderScheduler', () => ( {

            scheduleReminder: jest.fn(),
            cancelReminder: jest.fn().mockReturnValue( true )

        } ) );

        remind = require( '../commands/remind' );
        reminders = require( '../commands/reminders' );

    } );

    // Close the database after each test
    afterEach( () => {

        db.close();

    } );

    // Test cases
    test( 'set inserts a reminder with a correctly computed fireAt', async () => { // Integration test for the /remind set command

        const before = Date.now();

        await remind.execute( fakeInteraction( 'set', { time: '30m', message: 'take a break' } ) );

        const row = db.prepare( 'SELECT * FROM reminders WHERE userId = ?' ).get( 'user-1' );

        expect( row.message ).toBe( 'take a break' );
        expect( row.fireAt ).toBeGreaterThanOrEqual( before + 30 * 60 * 1000 );

    } );

    // Test that it rejects an invalid time format without touching the database
    test( 'set rejects an invalid time format without touching the database', async () => {

        await remind.execute( fakeInteraction( 'set', { time: 'not a time', message: 'test' } ) );

        const row = db.prepare( 'SELECT * FROM reminders WHERE userId = ?' ).get( 'user-1' );

        expect( row ).toBeUndefined();

    } );

    // Test that it rejects a time that's too long without touching the database
    test( "list returns only the calling user's reminders", async () => {

        await remind.execute( fakeInteraction( 'set', { time: '10m', message: 'first' } ) );
        await remind.execute( fakeInteraction( 'set', { time: '20m', message: 'second' } ) );
        await remind.execute( fakeInteraction( 'set', { time: '5m', message: 'not mine' }, 'user-2' ) );

        const listInteraction = fakeInteraction( 'list' );
        await reminders.execute( listInteraction );

        const embed = listInteraction.getReply().embeds[ 0 ];

        expect( embed.data.fields ).toHaveLength( 2 );
        expect( embed.data.fields[ 0 ].value ).toMatch( /first/ );
        expect( embed.data.fields[ 1 ].value ).toMatch( /second/ );

    } );

    // Test that it rejects a time that's too long without touching the database
    test( "cancel removes only the calling user's own reminder", async () => {

        await remind.execute( fakeInteraction( 'set', { time: '10m', message: 'to cancel' } ) );

        const saved = db.prepare( 'SELECT * FROM reminders WHERE userId = ?' ).get( 'user-1' );

        await remind.execute( fakeInteraction( 'cancel', { id: saved.id } ) );

        const afterCancel = db.prepare( 'SELECT * FROM reminders WHERE id = ?' ).get( saved.id );

        expect( afterCancel ).toBeUndefined();

    } );

    // Test that it rejects a time that's too long without touching the database
    test( 'cancel rejects an id belonging to a different user, without deleting it', async () => {

        await remind.execute( fakeInteraction( 'set', { time: '10m', message: 'not yours' }, 'user-2' ) );

        const saved = db.prepare( 'SELECT * FROM reminders WHERE userId = ?' ).get( 'user-2' );

        const cancelInteraction = fakeInteraction( 'cancel', { id: saved.id }, 'user-1' );
        await remind.execute( cancelInteraction );

        expect( cancelInteraction.getReply().content ).toMatch( /No reminder with ID/ );

        const stillThere = db.prepare( 'SELECT * FROM reminders WHERE id = ?' ).get( saved.id );
        expect( stillThere ).toBeDefined();

    } );

} );
