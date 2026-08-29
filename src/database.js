const Database = require( 'better-sqlite3' );

const db = new Database( 'dcb.sqlite' );

module.exports = db;
