require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testTutorMatching() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');
        
        // 1. Create a mock student with a request
        const student = new User({
            firstName: 'Test', lastName: 'Student', email: 'student-req-test@test.com',
            password: 'pwd', userType: 'student',
            tutorRequests: [{ subject: 'Biology', priority: 'medium', requestedTime: '1hour', status: 'pending' }]
        });
        await student.save();
        
        // 2. Create a mock tutor who ONLY has subjects in tutorApplication (not profile)
        const tutor = new User({
            firstName: 'Test', lastName: 'Tutor', email: 'tutor-req-test@test.com',
            password: 'pwd', userType: 'tutor',
            tutorApplication: { name: 'Test Tutor', age: 20, subjects: ['Biology', 'Math'], status: 'approved' }
        });
        // Deliberately omit tutorProfile
        await tutor.save();

        console.log('✅ Created mock users. Testing matching logic...');

        // Simulate logic from routes/tutor.js
        const tutorSubjects = (tutor.tutorProfile?.subjects?.length > 0) 
            ? tutor.tutorProfile.subjects 
            : (tutor.tutorApplication?.subjects || []);

        console.log('Tutor loaded subjects:', tutorSubjects);

        const students = await User.find({ userType: 'student', 'tutorRequests': { $exists: true } });
        const requests = [];

        students.forEach(s => {
            if (s.tutorRequests) {
                s.tutorRequests.forEach((req, index) => {
                    const reqSubject = req.subject || '';
                    const hasGeneral = tutorSubjects.some(sub => sub === 'General' || sub === 'General Help');
                    const subjectMatches = hasGeneral || tutorSubjects.includes(reqSubject) || tutorSubjects.length === 0;
                    
                    if (req.status === 'pending' && subjectMatches) {
                        requests.push({ studentId: s._id, subject: req.subject });
                    }
                });
            }
        });

        console.log(`✅ Found ${requests.length} matching requests.`);
        const foundOurRequest = requests.some(r => r.studentId.toString() === student._id.toString() && r.subject === 'Biology');
        if (foundOurRequest) {
            console.log('🎉 SUCCESS: Tutor correctly matched the Biology request via tutorApplication.subjects');
        } else {
            console.log('❌ FAILURE: Tutor did not see the Biology request');
        }

        // Cleanup
        await User.deleteOne({ _id: student._id });
        await User.deleteOne({ _id: tutor._id });
        await mongoose.disconnect();
    } catch (e) {
        console.error('Error during test:', e);
        process.exit(1);
    }
}
testTutorMatching();
