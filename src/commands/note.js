/**
 * 
 * This function handles the /note command and its subcommands: save, list, and delete.
 * It retrieves the subcommand from the interaction options and executes the corresponding logic.
 * 
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } - interaction.
 * 
 */

async function note( interaction ) {

    const subcommand = interaction.options.getSubcommand();

    // Handle the subcommands for the /note command
    switch ( subcommand ) {

        // Handle the 'save' subcommand
        case 'save': {

            const text = interaction.options.getString( 'text' );
            await interaction.reply( `(stub) Would save a new note with text: ${ text }.` );
            break;

        }

        // Handle the 'list' subcommand
        case 'list': {

            await interaction.reply( '(stub) Would list your saved notes.' );
            break;

        }

        // Handle the 'delete' subcommand
        case 'delete': {

            const id = interaction.options.getInteger( 'id' );
            await interaction.reply( `(stub) Would delete note with ID ${ id }.` );
            break;

        }

        default: // This should never happen if the command is registered correctly

            await interaction.reply( '(stub) Invalid subcommand.' );

    }

}

module.exports = { name: 'note', execute: note };
