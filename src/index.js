const { Client, GatewayIntentBits, Events } = require( 'discord.js' );
require( 'dotenv' ).config();

// Fail fast if the token is missing - a bot with no token can't do anything
if ( !process.env.DISCORD_TOKEN ) {
    console.error( 'Missing DISCORD_TOKEN in .env - see .env.example.' );
    process.exit( 1 );
}

// Create client
// GatewayIntentBits.Guilds is the minimum required for the bot to connect and appear online
const client = new Client( { intents: [ GatewayIntentBits.Guilds ] } );

client.once( Events.ClientReady, ( readyClient ) => {
    console.log( `DCB Bot online as ${ readyClient.user.tag }` );
} );

client.login( process.env.DISCORD_TOKEN );



const remind = require( './commands/remind.js' );
const reminders = require( './commands/reminders.js' );
const note = require( './commands/note.js' );
const serverinfo = require( './commands/serverinfo.js' );
const slowmode = require( './commands/slowmode.js' );

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
