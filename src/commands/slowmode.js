/**
 *
 * This function handles the /slowmode command.
 * It retrieves the duration option from the interaction and executes the corresponding logic.
 *
 * @param { import( 'discord.js' ).ChatInputCommandInteraction } - interaction.
 *
 */

async function slowmode( interaction ) {

    const duration = interaction.options.getString( 'duration' );

    await interaction.reply( `(stub) Would set slowmode to ${ duration }.` );

}

module.exports = { name: 'slowmode', execute: slowmode };
