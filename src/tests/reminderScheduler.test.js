// Test suite for the reminder scheduler functionality
describe( 'reminderScheduler', () => {

    let scheduleReminder;
    let cancelReminder;
    let fakeDb;
    let fakeClient;
    let sendMock;

    // Fresh module, fresh fake timers, and fresh mocks for every test
    beforeEach( () => {

        jest.resetModules();
        jest.useFakeTimers();

        sendMock = jest.fn().mockResolvedValue( undefined );

        fakeClient = {

            users: { fetch: jest.fn().mockResolvedValue( { send: sendMock } ) }

        };

        fakeDb = { prepare: jest.fn().mockReturnValue( { run: jest.fn() } ) };

        ( { scheduleReminder, cancelReminder } = require( '../reminderScheduler' ) );

    } );

    // Close the database after each test
    afterEach( () => {

        jest.useRealTimers();

    } );

    // Test that a reminder scheduled in the past fires almost immediately, simulating a bot restart catch-up
    test( 'does not fire before its delay has elapsed', async () => {

        const reminder = { id: 1, userId: 'user-1', message: 'too early', fireAt: Date.now() + 60000 };

        scheduleReminder( fakeClient, reminder, fakeDb );

        await jest.advanceTimersByTimeAsync( 30000 ); // halfway there

        expect( sendMock ).not.toHaveBeenCalled();

    } );

    // Test that a reminder scheduled in the past fires almost immediately, simulating a bot restart catch-up
    test( 'fires and DMs the user once its delay has elapsed', async () => {

        const reminder = { id: 2, userId: 'user-1', message: 'take a break', fireAt: Date.now() + 1000 };

        scheduleReminder( fakeClient, reminder, fakeDb );

        await jest.advanceTimersByTimeAsync( 1000 );

        expect( fakeClient.users.fetch ).toHaveBeenCalledWith( 'user-1' );
        expect( sendMock ).toHaveBeenCalledWith( expect.stringContaining( 'take a break' ) );
        expect( fakeDb.prepare ).toHaveBeenCalledWith( expect.stringContaining( 'DELETE FROM reminders' ) );

    } );

    // Bot was down past fireAt - should fire almost immediately, not get dropped
    test( 'a reminder scheduled in the past fires almost immediately (bot restart catch-up)', async () => {

        const reminder = { id: 3, userId: 'user-1', message: 'overdue', fireAt: Date.now() - 60000 };

        scheduleReminder( fakeClient, reminder, fakeDb );

        await jest.advanceTimersByTimeAsync( 0 );

        expect( sendMock ).toHaveBeenCalled();

    } );

    // Test that cancelReminder prevents a scheduled reminder from firing
    test( 'cancelReminder clears a pending reminder and prevents it from firing', async () => {

        const reminder = { id: 4, userId: 'user-1', message: 'should not fire', fireAt: Date.now() + 60000 };

        scheduleReminder( fakeClient, reminder, fakeDb );

        const wasCancelled = cancelReminder( 4 );

        await jest.advanceTimersByTimeAsync( 60000 );

        expect( wasCancelled ).toBe( true );
        expect( sendMock ).not.toHaveBeenCalled();

    } );

    // Test that cancelReminder returns false for an id that was never scheduled
    test( 'cancelReminder returns false for an id that was never scheduled', () => {

        expect( cancelReminder( 999 ) ).toBe( false );

    } );

    // Matches the try/catch in reminderScheduler.js - a blocked DM still gets the row cleaned up
    test( 'still deletes the DB row even if the DM fails (user blocked DMs or left the server)', async () => {

        sendMock.mockRejectedValueOnce( new Error( 'Cannot send messages to this user' ) );

        const reminder = { id: 5, userId: 'user-1', message: 'test', fireAt: Date.now() + 1000 };

        scheduleReminder( fakeClient, reminder, fakeDb );

        await jest.advanceTimersByTimeAsync( 1000 );

        expect( fakeDb.prepare ).toHaveBeenCalledWith( expect.stringContaining( 'DELETE FROM reminders' ) );

    } );

} );
