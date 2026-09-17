/*

Only these two tables are allowed here - never build this query from unvalidated input.

*/

const ALLOWED_TABLES = [ 'reminders', 'notes' ];


/**
 * 
 * This finds the smallest available ID for a table, filling gaps left by
 *  deleted rows instead of incremementing infinitely. Empty table returns 1.
 *  IDs {1,2,4} returns 3 (the gap), not 5.
 * 
 * @param { import( 'better-sqlite3' ).Database } db - shared connection.
 * @param { string } tableName - must be one of ALLOWED_TABLES.
 * @returns { number } - the next ID to use.
 * 
 */

function getNextAvailableId( db, tableName ) {

    // Fail fast on any table not explicitly allowed, since this builds a raw SQL string
    if ( !ALLOWED_TABLES.includes( tableName ) ) {
        throw new Error( `getNextAvailableId: "${ tableName }" is not an allowed table.` );

    }

    const row = db.prepare(

        `SELECT MIN( id ) + 1 AS nextId
         FROM ( SELECT id FROM ${ tableName } UNION SELECT 0 AS id )
         WHERE ( id + 1 ) NOT IN ( SELECT id FROM ${ tableName } )`

    ).get();

    return row.nextId;

}

module.exports = {
    
    getNextAvailableId

};
