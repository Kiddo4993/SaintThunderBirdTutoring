const fetch = process.versions.node.startsWith('18') ? global.fetch : require('node-fetch');

async function run() {
    try {
        // 1. Sign up a test student
        const signupRes = await fetch('http://localhost:5001/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'Student',
                email: 'test.student.req4@example.com',
                password: 'password123',
                userType: 'student'
            })
        });
        const signupData = await signupRes.json();
        console.log('Signup:', signupData);
        if (!signupData.token) return;

        // 2. Create a request
        const reqRes = await fetch('http://localhost:5001/api/tutor/create-request', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${signupData.token}`
            },
            body: JSON.stringify({
                subject: 'Mathematics',
                requestedTime: '1hour',
                description: 'Please help',
                priority: 'medium',
                selectedTutorId: ''
            })
        });
        const reqData = await reqRes.json();
        console.log('Create Request Result:', reqData);
    } catch (e) {
        console.error(e);
    }
}
run();
