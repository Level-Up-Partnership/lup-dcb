const Database = require( 'better-sqlite3' );
const { hasReachedLimit, limitForDisplay, MAX_ITEMS_PER_USER } = require( '../utils/userLimits' );

let db;

beforeEach( () => {

    db = new Database( ':memory:' ); // fresh RAM-only DB per test, never touches dcb.sqlite

    db.exec( `CREATE TABLE reminders (

        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        message TEXT NOT NULL,
        fireAt INTEGER NOT NULL

    );` );

} );

afterEach( () => {

    db.close();

} );


/**
 *
 * Inserts a number of reminders for one user directly into the test database.
 *
 * @param { string } userId - Discord user ID to insert for.
 * @param { number } count - how many reminders to insert.
 * @returns { void }
 *
 */

function insertReminders( userId, count ) {

    const insert = db.prepare( 'INSERT INTO reminders ( userId, message, fireAt ) VALUES ( ?, ?, ? )' );

    // Index only used to give each reminder a distinct message
    for ( let i = 0; i < count; i++ ) {

        insert.run( userId, `reminder ${ i }`, Date.now() );

    }

}

// hasReachedLimit

test( 'returns false one below the cap', () => {

    insertReminders( 'user-1', MAX_ITEMS_PER_USER - 1 );

    expect( hasReachedLimit( db, 'reminders', 'user-1' ) ).toBe( false );

} );

test( 'returns true at the cap', () => {

    insertReminders( 'user-1', MAX_ITEMS_PER_USER );

    expect( hasReachedLimit( db, 'reminders', 'user-1' ) ).toBe( true );

} );

test( 'only counts the calling user\'s rows', () => {

    insertReminders( 'user-2', MAX_ITEMS_PER_USER );

    expect( hasReachedLimit( db, 'reminders', 'user-1' ) ).toBe( false );

} );

test( 'throws on a table outside the allowlist', () => {

    expect( () => hasReachedLimit( db, 'users', 'user-1' ) ).toThrow();

} );

// limitForDisplay

test( 'limitForDisplay keeps everything and has no footer at the cap', () => {

    const items = Array.from( { length: MAX_ITEMS_PER_USER }, ( _, i ) => i );

    const { shown, footerText } = limitForDisplay( items, 'reminders' );

    expect( shown ).toHaveLength( MAX_ITEMS_PER_USER );
    expect( footerText ).toBeNull();

} );

test( 'limitForDisplay trims to the cap and explains why past it', () => {

    const items = Array.from( { length: MAX_ITEMS_PER_USER + 1 }, ( _, i ) => i );

    const { shown, footerText } = limitForDisplay( items, 'reminders' );

    expect( shown ).toHaveLength( MAX_ITEMS_PER_USER );
    expect( footerText ).toBe( `Showing ${ MAX_ITEMS_PER_USER } of ${ MAX_ITEMS_PER_USER + 1 } reminders.` );

} );
