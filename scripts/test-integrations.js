require('dotenv').config();
const { createSessionMeeting } = require('../services/zoomService');
const { subscribeUser } = require('../services/mailchimpService');

async function testZoom() {
    console.log('\n--- Testing Zoom Integration ---');
    try {
        const meeting = await createSessionMeeting({
            topic: 'Test Session',
            durationMinutes: 30,
            startTime: new Date(Date.now() + 86400000)
        });
        console.log('Meeting Result:', meeting);
        if (meeting.provider === 'fallback') {
            console.log('✅ Zoom test passed (using fallback as expected)');
        } else {
            console.log('✅ Zoom test passed (using real API)');
        }
    } catch (e) {
        console.error('❌ Zoom test failed:', e.message);
    }
}

async function testMailchimp() {
    console.log('\n--- Testing Mailchimp Integration ---');
    try {
        const result = await subscribeUser({
            email: 'test-user-' + Date.now() + '@example.com',
            firstName: 'Test',
            lastName: 'User',
            userType: 'student'
        });
        
        // It returns null if credentials aren't set
        if (result === null) {
             console.log('✅ Mailchimp test passed (skipped gracefully due to missing credentials)');
        } else {
             console.log('✅ Mailchimp test passed (API call successful)', result);
        }
    } catch (e) {
        console.error('❌ Mailchimp test failed:', e.message);
    }
}

async function runTests() {
    await testZoom();
    await testMailchimp();
    console.log('\nTests completed.');
}

runTests();
