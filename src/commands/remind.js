const db = require( '../database' );
const { parseTimeToMinutes } = require( '../utils/timeParser' );
const { scheduleReminder, cancelReminder } = require( '../reminderScheduler' );
const { getNextAvailableId } = require( '../utils/idReuser' );


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

            const timeString = interaction.options.getString( 'time' );
            const message = interaction.options.getString( 'message' );

            const parsedTime = parseTimeToMinutes( timeString );

            // Reject invalid time formats before touching the database
            if ( !parsedTime.valid ) {

                await interaction.reply( { content: parsedTime.error, ephemeral: true } );
                return;

            }

            // fireAt is a STORED absolute timestamp, not the raw duration - survives restarts
            const fireAt = Date.now() + ( parsedTime.minutes * 60 * 1000 ); // minutes to ms

            // Reuse the smallest available ID instead of always growing upward
            const id = getNextAvailableId( db, 'reminders' );

            db.prepare(

                'INSERT INTO reminders ( id, userId, message, fireAt ) VALUES ( ?, ?, ?, ? )'

            ).run( id, interaction.user.id, message, fireAt );

            const reminder = { id, userId: interaction.user.id, message, fireAt };

            scheduleReminder( interaction.client, reminder, db );

            await interaction.reply( `Reminder #${ reminder.id } set for <t:${ Math.floor( fireAt / 1000 ) }:R>.` );
            break;

        }

        // Handle the 'cancel' subcommand
        case 'cancel': {

            const id = interaction.options.getInteger( 'id' );

            const reminder = db.prepare(

                'SELECT * FROM reminders WHERE id = ? AND userId = ?'

            ).get( id, interaction.user.id );

            // Reject if no matching reminder belongs to this user
            if ( !reminder ) {

                await interaction.reply( { content: `No reminder with ID ${ id } found.`, ephemeral: true } );
                return;

            }

            cancelReminder( id );
            db.prepare( 'DELETE FROM reminders WHERE id = ?' ).run( id );

            await interaction.reply( `Reminder #${ id } cancelled.` );
            break;

        }

        default: // This should never happen if the command is registered correctly

            await interaction.reply( 'Unknown subcommand.' );

    }

}

module.exports = {
    
    name: 'remind', execute

};
