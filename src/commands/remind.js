/**
 * 
 * This function handles the /remind set and /remind cancel commands.
 * It retrieves the subcommand from the interaction options and executes the corresponding logic.
 * 
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } - interaction.
 * 
 */

async function execute( interaction ) {

    const subcommand = interaction.options.getSubcommand();

    // Handle the subcommands for the /remind command
    switch ( subcommand ) {

        // Handle the 'set' subcommand
        case 'set': {

            const time = interaction.options.getString( 'time' );
            const message = interaction.options.getString( 'message' );
            await interaction.reply( `(stub) Would set a reminder for ${ message } in ${ time }.` );
            break;

        }

        // Handle the 'cancel' subcommand
        case 'cancel': {

            const id = interaction.options.getInteger( 'id' );
            await interaction.reply( `(stub) Would cancel reminder with ID ${ id }.` );
            break;

        }

        default: // This should never happen if the command is registered correctly

            await interaction.reply( 'Unknown subcommand.' );

    }

}

module.exports = { name: 'remind', execute };
