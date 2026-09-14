// The database connection
const Database = require( 'better-sqlite3' );

// Create a new database connection
const db = new Database( 'dcb.sqlite' );

// Export the database connection
module.exports = db;
