const { ALLOWED_TABLES } = require( './idReuser' );

const MAX_ITEMS_PER_USER = 25; // Discord allows at most 25 fields per embed, and /reminders and /note list use one field per item

const MAX_TEXT_LENGTH = 100; // 25 items x 100 characters stays well under Discord's 6000-character total per embed


/**
 *
 * This function checks whether a user already has the maximum number of rows in a table.
 *
 * @param { import( 'better-sqlite3' ).Database } db - Shared connection.
 * @param { string } tableName - Must be one of ALLOWED_TABLES.
 * @param { string } userId - Discord user ID.
 * @returns { boolean } - True if the user is at or over the cap.
 *
 */

function hasReachedLimit( db, tableName, userId ) {

    // Fail fast on any table not explicitly allowed, since this builds a raw SQL string
    if ( !ALLOWED_TABLES.includes( tableName ) ) {

        throw new Error( `hasReachedLimit: "${ tableName }" is not an allowed table.` );

    }

    const { count } = db.prepare(

        `SELECT COUNT( * ) AS count FROM ${ tableName } WHERE userId = ?`

    ).get( userId );

    return count >= MAX_ITEMS_PER_USER;

}



/**
 *
 * Trims a list down to what one embed can display, and builds a footer note if anything was cut.
 *
 * @param { Array } items - the full list, already in display order.
 * @param { string } label - plural noun used in the footer, e.g. 'reminders'.
 * @returns { { shown: Array, footerText: ( string | null ) } } - footerText is null when nothing was cut.
 *
 */

function limitForDisplay( items, label ) {

    const shown = items.slice( 0, MAX_ITEMS_PER_USER );

    // Nothing cut - the normal case once the save-time cap is in place
    if ( items.length <= MAX_ITEMS_PER_USER ) {

        return { shown, footerText: null };

    }

    return { shown, footerText: `Showing ${ MAX_ITEMS_PER_USER } of ${ items.length } ${ label }.` };

}

module.exports = {

    hasReachedLimit, MAX_ITEMS_PER_USER, MAX_TEXT_LENGTH, limitForDisplay

};
