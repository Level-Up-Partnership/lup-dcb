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
