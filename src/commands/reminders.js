/**
 * 
 * This command is used to list the user's pending reminders.
 * 
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } - interaction.
 * 
 */

async function listReminders( interaction ) {

    // List the user's pending reminders (stub implementation)
    await interaction.reply( '(stub) Would list your pending reminders.' );

}

module.exports = { name: 'reminders', execute: listReminders };
