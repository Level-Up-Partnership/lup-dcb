const db = require( '../database' );
const { getNextAvailableId } = require( '../utils/idReuser' );


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

            // Reuse the smallest available ID instead of always growing upward
            const id = getNextAvailableId( db, 'notes' );

            db.prepare(

                'INSERT INTO notes ( id, userId, text ) VALUES ( ?, ?, ? )'

            ).run( id, interaction.user.id, text );

            await interaction.reply( { content: `Note #${ id } saved.`, ephemeral: true } );
            break;

        }

        // Handle the 'list' subcommand
        case 'list': {

            const savedNotes = db.prepare(

                'SELECT * FROM notes WHERE userId = ? ORDER BY id ASC'

            ).all( interaction.user.id );

            // Handle the case where the user has nothing saved
            if ( savedNotes.length === 0 ) {

                await interaction.reply( { content: 'You have no saved notes.', ephemeral: true } );
                return;

            }

            const lines = savedNotes.map( ( savedNote ) => `#${ savedNote.id } - ${ savedNote.text }` );

            await interaction.reply( { content: lines.join( '\n' ), ephemeral: true } );
            break;

        }

        // Handle the 'delete' subcommand
        case 'delete': {

            const id = interaction.options.getInteger( 'id' );

            const savedNote = db.prepare(

                'SELECT * FROM notes WHERE id = ? AND userId = ?'

            ).get( id, interaction.user.id );

            // Reject if no matching note belongs to this user
            if ( !savedNote ) {

                await interaction.reply( { content: `No note with ID ${ id } found.`, ephemeral: true } );
                return;

            }

            db.prepare( 'DELETE FROM notes WHERE id = ?' ).run( id );

            await interaction.reply( { content: `Note #${ id } deleted.`, ephemeral: true } );
            break;

        }

        default: // This should never happen if the command is registered correctly

            await interaction.reply( 'Unknown subcommand.' );

    }

}

module.exports = {
    
    name: 'note', execute: note

};
