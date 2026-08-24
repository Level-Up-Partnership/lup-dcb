const { REST, Routes } = require( 'discord.js' );
require( 'dotenv' ).config();

const commands = require( './commands/definitions.js' );


/**
 * 
 * Registers the command list with Discord's API, for a single guild (server) only.
 * Guild-scoped registration updates immediately, while global registration can take up to an hour to propagate.
 * DISCORD_GUILD_ID must be set in the .env file for this to work.
 * 
 * @returns - successful registration of commands with Discord's API, or an error if registration fails
 * 
 */

async function deployCommands() {

    // Fail fast if any of the required environment variables are missing
    if ( !process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_GUILD_ID ) {

        console.error( 'Missing DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env' );
        return;

    }

    const rest = new REST().setToken( process.env.DISCORD_TOKEN );

    // Register commands with Discord
    try {

        console.log( `Registering ${ commands.length } application (/) commands.` );
        const commandsJSON = commands.map( ( command ) => command.toJSON() );

        await rest.put(

            // Register commands for a single guild (server)
            Routes.applicationGuildCommands( 

                process.env.DISCORD_CLIENT_ID,
                process.env.DISCORD_GUILD_ID ),

            { body: commandsJSON }

        );

        console.log( 'Successfully registered application (/) commands with Discord.' );

    } catch ( error ) { // Display any errors that occur during registration

        console.error( 'Error registering commands:', error );

    }

}

deployCommands();
