const { EmbedBuilder, MessageFlags } = require( 'discord.js' );
const db = require( '../database' );
const { hasReachedLimit, limitForDisplay, MAX_ITEMS_PER_USER } = require( '../utils/userLimits' );


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

            // Reject once the user hits the cap - /note list can only display this many in one embed
            if ( hasReachedLimit( db, 'notes', interaction.user.id ) ) {

                await interaction.reply( {

                    content: `You can have at most ${ MAX_ITEMS_PER_USER } saved notes. Delete one with /note delete first.`,
                    flags: MessageFlags.Ephemeral

                } );
                return;

            }

            const text = interaction.options.getString( 'text' );

            // Real id is handled entirely by SQLite's own AUTOINCREMENT now
            db.prepare(

                'INSERT INTO notes ( userId, text ) VALUES ( ?, ? )'

            ).run( interaction.user.id, text );

            await interaction.reply( { content: 'Note saved.', ephemeral: true } );
            break;

        }

        // Handle the 'list' subcommand
        case 'list': {

            const savedNotes = getOrderedNotes( interaction.user.id );

            // Handle the case where the user has nothing saved
            if ( savedNotes.length === 0 ) {

                await interaction.reply( { content: 'You have no saved notes.', ephemeral: true } );
                return;

            }

                        // Discord allows 25 fields per embed - trim defensively in case rows predate the save-time cap
            const { shown, footerText } = limitForDisplay( savedNotes, 'notes' );

            // Display position is the array index + 1 - real id is never shown
            const notesEmbed = new EmbedBuilder()

                .setTitle( 'Your Saved Notes' )
                .setColor( 0x5865F2 ) // Discord's own "blurple" brand color, matching /serverinfo and /reminders
                .addFields(

                    shown.map( ( savedNote, index ) => ( {

                        name: `#${ index + 1 }`,
                        value: savedNote.text

                    } ) )

                );

            // Tell the user some were left out rather than dropping them silently
            if ( footerText ) {

                notesEmbed.setFooter( { text: footerText } );

            }

            await interaction.reply( { embeds: [ notesEmbed ], ephemeral: true } );
            break;

        }

        // Handle the 'delete' subcommand
        case 'delete': {

            const position = interaction.options.getInteger( 'position' );

            const savedNotes = getOrderedNotes( interaction.user.id );

            // Convert the user-facing position (1-based) to an array index (0-based)
            const index = position - 1;

            // Reject if the position doesn't land on an actual note - covers 0, negatives, and anything past the end
            if ( index < 0 || index >= savedNotes.length ) {

                await interaction.reply( { content: `No note at position ${ position }.`, ephemeral: true } );
                return;

            }

            const targetNote = savedNotes[ index ];

            db.prepare( 'DELETE FROM notes WHERE id = ?' ).run( targetNote.id );

            await interaction.reply( { content: `Note #${ position } deleted.`, ephemeral: true } );
            break;

        }

        default: // This should never happen if the command is registered correctly

            await interaction.reply( 'Unknown subcommand.' );

    }

}


/**
 *
 * This function fetches a user's notes ordered by their real (permanent) id.
 * 
 * This exact ordering is what defines display position everywhere else - list
 *  and delete must both call this instead of querying independently, or their
 *  position numbering could drift apart.
 *
 * @param { string } userId - The ID of the user whose notes are being fetched.
 * @returns { Array } - The user's notes, oldest real id first.
 *
 */

function getOrderedNotes( userId ) {

    return db.prepare(

        'SELECT * FROM notes WHERE userId = ? ORDER BY id ASC'

    ).all( userId );

}

module.exports = {

    name: 'note', execute: note

};
