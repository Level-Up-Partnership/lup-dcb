const { Client, GatewayIntentBits, Events } = require( 'discord.js' );
require( 'dotenv' ).config();
require( './schema' ); // Load the database schema

const remind = require( './commands/remind.js' );
const reminders = require( './commands/reminders.js' );
const note = require( './commands/note.js' );
const serverinfo = require( './commands/serverinfo.js' );
const slowmode = require( './commands/slowmode.js' );

const db = require( './database' ); // Import the database connection
const { scheduleReminder } = require( './reminderScheduler' ); // Import the reminder scheduler utility

// Fail fast if the token is missing - a bot with no token can't do anything
if ( !process.env.DISCORD_TOKEN ) {

    console.error( 'Missing DISCORD_TOKEN in .env - see .env.example.' );
    process.exit(1);

}

// Create client
// GatewayIntentBits.Guilds is the minimum required for the bot to connect and appear online
const client = new Client( { intents: [ GatewayIntentBits.Guilds ] } );

client.once( Events.ClientReady, ( readyClient ) => {

    console.log( `DCB Bot online as ${ readyClient.user.tag }` );

    // Re-schedule every pending reminder now that the client is actually logged in.
    // No fireAt filter here on purpose - overdue reminders still need to fire, not vanish silently.
    const pendingReminders = db.prepare( 'SELECT * FROM reminders' ).all();

    pendingReminders.forEach( ( reminder, index ) => {

        /** Stagger reminders that are already overdue (fireAt in the past) so
             multiple DMs to the same user on a single restart don't fire in the same instant. Discord's own API rejects opening a second DM channel to the same user too quickly (DiscordAPIError 40003), and this only affects the in-memory firing order for THIS run, the original fireAt stays untouched in the database, since that's the stored source of truth.
          */
        const isOverdue = reminder.fireAt <= Date.now();
        const staggeredReminder = isOverdue

            ? { ...reminder, fireAt: Date.now() + ( index * 1500 ) } // 1.5s apart, well outside Discord's DM-open rate limit window
            : reminder;

        scheduleReminder( readyClient, staggeredReminder, db );

    } );

} );


const commands = new Map();

[ remind, reminders, note, serverinfo, slowmode ].forEach( ( command ) => {

    commands.set( command.name, command );

} );


// Listen for interactions
client.on( Events.InteractionCreate, async ( interaction ) => {

    // Guard against non-command interactions
    if ( !interaction.isChatInputCommand() ) {

        return;
        
    }

    const command = commands.get( interaction.commandName );

    // This guards against a user using a command that doesn't exist
    if ( !command ) {

        await interaction.reply( 'Command not found' );
        return;

    }

    // Execute the command and catch any errors
    try {

        await command.execute( interaction );

    } catch ( error ) { // If an error occurs, show it in the console and send a message to the user

        console.error( error );
        await interaction.reply( 'There was an error while executing this command!' );

    }

} );

client.login( process.env.DISCORD_TOKEN );
