const { MessageFlags } = require( 'discord.js' );


/**
 *
 * This tells the user a command failed, without ever throwing itself.
 * Uses followUp when a reply was already sent, since an interaction can only be replied to once.
 *
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } interaction
 * @returns { Promise<void> }
 *
 */

async function replyWithError( interaction ) {

    const errorMessage = { content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral };

    // This function is designed to never throw, so we catch any errors from the reply/followUp calls and log them instead of throwing
    try {

        // An interaction can only be replied to once - anything after that must be a follow-up
        if ( interaction.replied || interaction.deferred ) {

            await interaction.followUp( errorMessage );

        } else { // nothing sent yet

            await interaction.reply( errorMessage );

        }

    } catch ( error ) { // catches expired interactions (past Discord's 3-second window) - no way left to reach the user, so log only

        console.error( 'Could not send error reply:', error );

    }

}

module.exports = {

    replyWithError

};
