const { PermissionFlagsBits } = require( 'discord.js' );
const { parseSlowmodeDuration } = require( '../utils/slowmodeParser' );


/**
 *
 * This function handles the /slowmode command.
 * It retrieves the duration option from the interaction and executes the corresponding logic.
 *
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } - interaction.
 *
 */

async function slowmode( interaction ) {

    // const duration = interaction.options.getString( 'duration' );

    // await interaction.reply( `(stub) Would set slowmode to ${ duration }.` );

    // Reject if the calling user doesn't have permission to manage this channel
    if( !interaction.member.permissions.has( PermissionFlagsBits.ManageChannels ) ) {

        await interaction.reply( { content: 'You need the Manage Channels permission to use this command.', ephemeral: true } );
        return;

    }

    const durationString = interaction.options.getString( 'duration' );
    const parsedDuration = parseSlowmodeDuration( durationString );

    // Reject invalid duration formats before touching the Discord API
    if( !parsedDuration.valid ) {

        await interaction.reply( { content: parsedDuration.error, ephemeral: true } );
        return;

    }

    await interaction.channel.setRateLimitPerUser(
        
        parsedDuration.seconds, `Slowmode set by ${ interaction.user.tag } via /slowmode`
    
    );
    
    if( parsedDuration.seconds === 0 ) {

        await interaction.reply( 'Slowmode disabled for this channel.' );

    } else { // Confirm the applied duration

        await interaction.reply( `Slowmode set to ${ parsedDuration.seconds } seconds for this channel.` );

    }

}

module.exports = {
    
    name: 'slowmode', execute: slowmode

};
