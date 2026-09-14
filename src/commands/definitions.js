const { SlashCommandBuilder } = require('discord.js');


// /remind - has two subcommands, since Discord can't mix flat options with subcommands
// on the same top-level command (set a reminder vs. cancel one)
const remindCommand = new SlashCommandBuilder()

    .setName( 'remind' )
    .setDescription( 'Set or cancel a reminder' )
    .addSubcommand( ( subcommand ) => 

        subcommand
            .setName( 'set' )
            .setDescription( 'Set a reminder' )
            .addStringOption( ( option ) =>

                option
                    .setName( 'time' )
                    .setDescription( 'How long from now, e.g., 10 minutes, 1 hour' )
                    .setRequired( true )

            )
            .addStringOption( ( option ) =>

                option
                    .setName( 'message' )
                    .setDescription( 'What to remind you of' )
                    .setRequired( true )

            )

    )
    .addSubcommand( ( subcommand ) =>

        subcommand
            .setName( 'cancel' )
            .setDescription( 'Cancel a pending reminder' )
            .addIntegerOption( ( option ) =>

                option
                    .setName( 'id' )
                    .setDescription( 'The ID of the reminder to cancel' )
                    .setRequired( true )

            )

    );


// /reminders - no options, just lists the calling user's own reminders
const remindersCommand = new SlashCommandBuilder()
    .setName( 'reminders' )
    .setDescription( 'List your pending reminders' );


// /note - has three subcommands: save, list, delete
const noteCommand = new SlashCommandBuilder()
    .setName( 'note' )
    .setDescription( 'Save, list, or delete notes' )
    .addSubcommand( ( subcommand ) =>

        subcommand
            .setName( 'save' )
            .setDescription( 'Save a new note' )
            .addStringOption( ( option ) =>

                option
                    .setName( 'text' )
                    .setDescription( 'The text of the note' )
                    .setRequired( true )

            )
        )

    .addSubcommand( ( subcommand ) =>

        subcommand
            .setName( 'list' )
            .setDescription( 'List your saved notes' )
    )

    .addSubcommand( ( subcommand ) =>

        subcommand
            .setName( 'delete' )
            .setDescription( 'Delete a note' )
            .addIntegerOption( ( option ) =>

                option
                    .setName( 'id' )
                    .setDescription( 'The ID of the note to delete' )
                    .setRequired( true )

            )
    );


// /serverinfo - no options, just returns information about the server
const serverInfoCommand = new SlashCommandBuilder()
    .setName( 'serverinfo' )
    .setDescription( 'Get information about the server' );


// /slowmode - single required option, accepts a duration or "off"
const slowmodeCommand = new SlashCommandBuilder()
    .setName( 'slowmode' )
    .setDescription( 'Set the slowmode duration for the channel' )
    .addStringOption( ( option ) =>

        option
            .setName( 'duration' )
            .setDescription( 'The slowmode duration (e.g., 10 seconds, 1 minute) or "off" to disable' )
            .setRequired( true )

    );

module.exports = [

    remindCommand,
    remindersCommand,
    noteCommand,
    serverInfoCommand,
    slowmodeCommand

];
