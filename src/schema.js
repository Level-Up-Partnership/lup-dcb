const db = require( './database' ); // Import the database connection

// Create tables if they don't exist
db.exec( `
    
    CREATE TABLE IF NOT EXISTS reminders (

        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        message TEXT NOT NULL,
        fireAt INTEGER NOT NULL

    );

` );

db.exec( `

    CREATE TABLE IF NOT EXISTS notes (
        
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        text TEXT NOT NULL

    );

` );
