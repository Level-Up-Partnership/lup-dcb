const Database = require( 'better-sqlite3' );
const { getNextAvailableId } = require( '../utils/idReuser' );


describe( 'getNextAvailableId', () => {

    let db;

    // Create a new in-memory database before each test and create the reminders table
    beforeEach( () => {

        db = new Database( ':memory:' );
        db.exec( `CREATE TABLE reminders ( id INTEGER PRIMARY KEY );` );

    } );

    // Close the database after each test
    afterEach( () => {

        db.close();

    } );

    // Matches idReuser.js's own JSDoc example - empty table should return 1
    test( 'returns 1 for an empty table', () => { 

        expect( getNextAvailableId( db, 'reminders' ) ).toBe( 1 );

    } );

    // Matches idReuser.js's own JSDoc example - ids {1,2,3} should return 4
    test( 'returns the next sequential id when there are no gaps', () => {

        db.exec( `INSERT INTO reminders ( id ) VALUES ( 1 ), ( 2 ), ( 3 );` );

        expect( getNextAvailableId( db, 'reminders' ) ).toBe( 4 );

    } );

    // Matches idReuser.js's own JSDoc example - ids {1,2,4} should return 3, not 5
    test( 'fills a gap left by a deleted row instead of growing past it', () => {

        db.exec( `INSERT INTO reminders ( id ) VALUES ( 1 ), ( 2 ), ( 4 );` );

        expect( getNextAvailableId( db, 'reminders' ) ).toBe( 3 );

    } );

    // Test that it throws for a table not explicitly allowed
    test( 'throws for any table not explicitly allowed', () => {

        expect( () => getNextAvailableId( db, 'users' ) ).toThrow( /not an allowed table/ );

    } );

} );
