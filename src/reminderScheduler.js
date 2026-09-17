const activeTimers = new Map(); // reminderId -> timeout handle, so /remind cancel can find and clear it


/**
 *
 * Schedules a reminder to fire at its stored fireAt timestamp. Used both when a reminder
 * is freshly created and when reminders are reloaded from the DB on bot startup.
 *
 * @param { import( 'discord.js' ).Client } client - Logged-in bot client, used to DM the user.
 * @param { { id: number, userId: string, message: string, fireAt: number } } reminder - Reminder object from the database.
 * @param { import( 'better-sqlite3' ).Database } db - Shared connection, used to delete the row on fire.
 * @returns { void } - Nothing, but schedules a setTimeout to fire the reminder at the right time.
 *
 */

function scheduleReminder( client, reminder, db ) {

    const msUntilFire = reminder.fireAt - Date.now();

    // Fire almost immediately if the time already passed (bot was down past fireAt) rather than dropping it silently
    const delay = msUntilFire > 0 ? msUntilFire : 0; // if the reminder is in the past, fire immediately

    const timeoutHandle = setTimeout( async () => {

        // Attempt to DM the user, but catch any errors (e.g., DMs blocked, user left the server)
        try {

            const user = await client.users.fetch( reminder.userId );
            await user.send( `⏰ Reminder: ${ reminder.message }` );

        } catch ( error ) { // catches DMs blocked or user left the server - reminder still gets cleaned up either way

            console.error( `Could not DM user ${ reminder.userId } for reminder ${ reminder.id }:`, error );

        }

        db.prepare( 'DELETE FROM reminders WHERE id = ?' ).run( reminder.id );
        activeTimers.delete( reminder.id );

    }, delay );

    activeTimers.set( reminder.id, timeoutHandle );

}


/**
 *
 * Cancels a scheduled reminder's in-memory timer by id.
 *
 * @param { number } reminderId - The ID of the reminder to cancel.
 * @returns { boolean } - True if a timer existed and was cleared.
 *
 */

function cancelReminder( reminderId ) {

    const timeoutHandle = activeTimers.get( reminderId );

    // Fail fast if there's no active timer for this id
    if ( !timeoutHandle ) {

        return false;

    }

    clearTimeout( timeoutHandle );
    activeTimers.delete( reminderId );
    return true;

}

module.exports = {
    
    scheduleReminder, cancelReminder

};
