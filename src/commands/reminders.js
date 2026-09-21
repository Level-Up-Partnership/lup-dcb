const { EmbedBuilder } = require( 'discord.js' );
const db = require( '../database' );


/**
 *
 * This command is used to list the user's pending reminders as a Discord embed.
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

    // One field per reminder - id stays real here, Reminders keep ID reuse, not position-based display like Notes
    const remindersEmbed = new EmbedBuilder()

        .setTitle( 'Your Pending Reminders' )
        .setColor( 0x5865F2 ) // Discord's own "blurple" brand color, matching /serverinfo
        .addFields(

            pendingReminders.map( ( reminder ) => ( {

                name: `#${ reminder.id }`,
                value: `${ reminder.message } - <t:${ Math.floor( reminder.fireAt / 1000 ) }:R>`

            } ) )

        );

    await interaction.reply( { embeds: [ remindersEmbed ], ephemeral: true } );

}

module.exports = {

    name: 'reminders', execute: listReminders

};