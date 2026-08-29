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
 * } - interaction.
 * 
 */

async function serverinfo( interaction ) {

    // Get the guild (server) from the interaction
    const guild = interaction.guild;

    // Get the member count of the guild
    const memberCount = guild.memberCount;

    // Get the name of the guild
    const guildName = guild.name;

    // Get the ID of the guild
    const guildId = guild.id;

    // Get the creation date of the guild
    const creationDate = guild.createdAt;

    // Get the owner of the guild
    const owner = await guild.fetchOwner();

    // Create a response message with the server information
    const responseMessage = `Server Name: ${ guildName }\nServer ID: ${ guildId }\nMember Count: ${ memberCount }\nCreation Date: ${ creationDate.toDateString() }\nOwner: ${ owner.user.tag }`;

    // Reply to the interaction with the server information
    await interaction.reply( responseMessage );

}

module.exports = { name: 'serverinfo', execute: serverinfo };
