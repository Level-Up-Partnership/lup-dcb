const db = require( '../database' ); // Import the database connection


/**
 * 
 * This command is used to list the user's pending reminders.
 * 
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } - interaction.
 * 
 */

async function listReminders( interaction ) {

    const pendingReminders = db.prepare(

        'SELECT * FROM reminders WHERE userId = ? ORDER BY fireAt ASC'

    ).all( interaction.user.id );

    // Handle the case where the user has nothing pending
    if ( pendingReminders.length === 0 ) {

        await interaction.reply( { content: 'You have no pending reminders.', ephemeral: true } );
        return;

    }

    const lines = pendingReminders.map( ( reminder ) =>

        `#${ reminder.id } - ${ reminder.message } - <t:${ Math.floor( reminder.fireAt / 1000 ) }:R>`

    );

    await interaction.reply( { content: lines.join( '\n' ), ephemeral: true } );

}

module.exports = {
    
    name: 'reminders', execute: listReminders

};
