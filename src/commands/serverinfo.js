const { EmbedBuilder } = require( 'discord.js' );

/**
 * 
 * This command retrieves information about the server (guild) where the command is executed.
 * It provides details such as the server name, ID, member count, creation date, and owner.
 * 
 * @param {
 * 
 *   guild: import( 'discord.js' ).Guild,
 *   reply: Function
 * 
 * } - Interaction.
 * 
 */

async function serverinfo( interaction ) {

    // Get the guild (server) from the interaction
    const guild = interaction.guild;

    // Get the member count of the guild
    const memberCount = guild.memberCount;

    // Get the creation date of the guild
    const creationDate = guild.createdAt;

    // Get the owner of the guild
    const owner = await guild.fetchOwner();

    // Get the number of channels and roles
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;

    /*
    // Create a response message with the server information
    const responseMessage = `Server Name: ${ guildName }\nServer ID: ${ guildId }\nMember Count: ${ memberCount }\nCreation Date: ${ creationDate.toDateString() }\nOwner: ${ owner.user.tag }\nChannel Count: ${ channelCount }\nRole Count: ${ roleCount }`;
    */

    // Embed the server information in a visually appealing format
    const serverInfoEmbed = new EmbedBuilder()
    
        .setTitle( guild.name )
        .setThumbnail( guild.iconURL() )
        .setColor( 0x5865F2 ) // Discord's own "blurple" brand color
        .addFields(

            { name: 'Member Count', value: `${ memberCount }`, inline: true },
            { name: 'Creation Date', value: creationDate.toDateString(), inline: true },
            { name: 'Owner', value: owner.user.tag, inline: true },
            { name: 'Channels', value: `${ channelCount }`, inline: true },
            { name: 'Roles', value: `${ roleCount }`, inline: true }

        );

    // Reply to the interaction with the server information
    await interaction.reply( { embeds: [serverInfoEmbed] } );

}

module.exports = {
    
    name: 'serverinfo', execute: serverinfo

};
