const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();

// Setup email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter is working
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email transporter ready');
    }
});

// Middleware to check if user is authenticated
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ===== APPLY AS TUTOR - SENDS EMAIL FOR APPROVAL =====
router.post('/apply-tutor', authMiddleware, async (req, res) => {
    try {
        const { name, age } = req.body;

        if (!name || !age) {
            return res.status(400).json({ error: 'Name and age required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                tutorApplication: {
                    name,
                    age,
                    status: 'pending',
                    appliedAt: new Date()
                }
            },
            { new: true }
        );

        const approveLink = `${process.env.ADMIN_URL || 'http://localhost:5000'}/api/tutor/approve/${user._id}`;
        const denyLink = `${process.env.ADMIN_URL || 'http://localhost:5000'}/api/tutor/deny/${user._id}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'dylanduancanada@gmail.com',
            subject: `New Tutor Application: ${name}`,
            html: `
                <h2>New Tutor Application</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Age:</strong> ${age}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Applied At:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p>
                    <a href="${approveLink}" style="background-color: green; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                        ✅ Approve Tutor
                    </a>
                    <a href="${denyLink}" style="background-color: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        ❌ Deny Application
                    </a>
                </p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Email error:', error);
            } else {
                console.log('✅ Email sent:', info.response);
            }
        });

        res.json({
            success: true,
            message: 'Application submitted! Admin will review shortly.',
            application: user.tutorApplication
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ADMIN: APPROVE TUTOR =====
router.get('/approve/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                userType: 'tutor',
                'tutorApplication.status': 'approved',
                'tutorApplication.approvedAt': new Date()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `
                <h2>Congratulations ${user.firstName}!</h2>
                <p>Your tutor application has been <strong>APPROVED</strong>!</p>
                <p>You can now start tutoring on Saint Thunderbird.</p>
                <p>Welcome to the team! 🚀</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('❌ Email error:', error);
        });

        res.json({
            success: true,
            message: 'Tutor approved and email sent!',
            tutor: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ADMIN: DENY TUTOR =====
router.get('/deny/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.findByIdAndUpdate(
            userId,
            { $unset: { tutorApplication: 1 } },
            { new: true }
        );

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Tutor Application Status',
            html: `
                <h2>Tutor Application Update</h2>
                <p>Thank you for applying to become a tutor on Saint Thunderbird.</p>
                <p>Unfortunately, your application has been <strong>DENIED</strong> at this time.</p>
                <p>You can apply again in the future. Thank you for your interest!</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('❌ Email error:', error);
        });

        res.json({
            success: true,
            message: 'Application denied and email sent!'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== STUDENT ENDPOINTS =====

// CREATE A TUTORING REQUEST (Student)
router.post('/create-request', authMiddleware, async (req, res) => {
    try {
        const { subject, description, priority } = req.body;
        const student = await User.findById(req.user.userId);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (!student.tutorRequests) {
            student.tutorRequests = [];
        }

        student.tutorRequests.push({
            subject,
            description,
            priority: priority || 'medium',
            createdAt: new Date(),
            status: 'pending'
        });

        await student.save();

        res.json({
            success: true,
            message: 'Request created successfully',
            request: student.tutorRequests[student.tutorRequests.length - 1]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET STUDENT'S REQUESTS
router.get('/my-requests', authMiddleware, async (req, res) => {
    try {
        const student = await User.findById(req.user.userId);

        if (!student || student.userType !== 'student') {
            return res.status(403).json({ error: 'Only students can view their requests' });
        }

        res.json({
            success: true,
            requests: student.tutorRequests || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET AVAILABLE TUTORS (for students)
router.get('/available-tutors', authMiddleware, async (req, res) => {
    try {
        const tutors = await User.find({ userType: 'tutor' });

        const availableTutors = tutors.map(tutor => ({
            _id: tutor._id,
            firstName: tutor.firstName,
            lastName: tutor.lastName,
            email: tutor.email,
            tutorProfile: tutor.tutorProfile
        }));

        res.json({
            success: true,
            tutors: availableTutors
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET STUDENT'S SESSIONS
router.get('/student-sessions', authMiddleware, async (req, res) => {
    try {
        const student = await User.findById(req.user.userId);

        if (!student || student.userType !== 'student') {
            return res.status(403).json({ error: 'Only students can view their sessions' });
        }

        const tutors = await User.find({ userType: 'tutor' });
        const sessions = [];

        for (const tutor of tutors) {
            if (tutor.tutorSessions) {
                tutor.tutorSessions.forEach(session => {
                    if (session.studentId.toString() === student._id.toString()) {
                        sessions.push({
                            _id: session._id,
                            tutorName: `${tutor.firstName} ${tutor.lastName}`,
                            tutorEmail: tutor.email,
                            subject: session.subject || 'Mathematics',
                            scheduledTime: session.scheduledTime,
                            status: session.status,
                            zoomLink: session.zoomLink
                        });
                    }
                });
            }
        }

        res.json({
            success: true,
            sessions: sessions.filter(s => new Date(s.scheduledTime) > new Date())
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE STUDENT PREFERENCES
router.post('/update-student-preferences', authMiddleware, async (req, res) => {
    try {
        const { interests, grade } = req.body;
        
        const student = await User.findByIdAndUpdate(
            req.user.userId,
            { 
                grade: grade,
                interests: interests
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Preferences updated',
            preferences: { interests, grade }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET STUDENT STATS
router.get('/student-stats', authMiddleware, async (req, res) => {
    try {
        const student = await User.findById(req.user.userId);

        if (!student || student.userType !== 'student') {
            return res.status(403).json({ error: 'Only students can view their stats' });
        }

        const requestsMade = student.tutorRequests?.length || 0;
        const upcomingSessions = student.tutorRequests?.filter(r => r.status === 'accepted').length || 0;
        const completedSessions = student.tutorRequests?.filter(r => r.status === 'completed').length || 0;
        const hoursLearned = student.tutorRequests?.reduce((sum, r) => sum + (r.hoursSpent || 0), 0) || 0;

        res.json({
            success: true,
            requestsMade,
            upcomingSessions,
            completedSessions,
            hoursLearned: hoursLearned.toFixed(1)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== TUTOR ENDPOINTS =====

// GET ALL REQUESTS FOR TUTORS IN THEIR SUBJECTS
router.get('/requests', authMiddleware, async (req, res) => {
    try {
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can view requests' });
        }

        const tutorSubjects = tutor.tutorProfile?.subjects || [];

        const students = await User.find({
            userType: 'student',
            'tutorRequests': { $exists: true }
        });

        const requests = [];
        students.forEach(student => {
            student.tutorRequests?.forEach(req => {
                if (req.status === 'pending' && tutorSubjects.includes(req.subject)) {
                    requests.push({
                        _id: `${student._id}-${req.createdAt}`,
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentEmail: student.email,
                        grade: student.grade || 'N/A',
                        subject: req.subject,
                        description: req.description,
                        priority: req.priority,
                        createdAt: req.createdAt
                    });
                }
            });
        });

        res.json({
            success: true,
            requests: requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ACCEPT A TUTORING REQUEST =====
router.post('/accept-request', authMiddleware, async (req, res) => {
    try {
        const { requestId, tutorName } = req.body;
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can accept requests' });
        }

        if (!tutor.tutorSessions) {
            tutor.tutorSessions = [];
        }

        const studentId = requestId.split('-')[0];
        const student = await User.findById(studentId);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Generate UNIQUE Zoom meeting ID for THIS session
        const uniqueZoomId = Math.floor(Math.random() * 9000000000) + 1000000000;
        const zoomPassword = 'Tutoring2025';
        const zoomLink = `https://zoom.us/j/${uniqueZoomId}?pwd=${zoomPassword}`;

        // Find the request subject
        let requestSubject = 'Mathematics';
        if (student.tutorRequests) {
            const foundReq = student.tutorRequests.find(r => r.status === 'pending');
            if (foundReq) {
                requestSubject = foundReq.subject;
            }
        }

        // Create session with unique Zoom ID
        const session = {
            studentId: studentId,
            subject: requestSubject,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'scheduled',
            createdAt: new Date(),
            zoomMeetingId: uniqueZoomId,
            zoomPassword: zoomPassword,
            zoomLink: zoomLink
        };

        tutor.tutorSessions.push(session);
        await tutor.save();

        // Update student request status
        if (student.tutorRequests) {
            student.tutorRequests.forEach(req => {
                if (req.status === 'pending') {
                    req.status = 'accepted';
                }
            });
            await student.save();
        }

        // ===== EMAIL TO TUTOR =====
        const tutorMailOptions = {
            from: process.env.EMAIL_USER,
            to: tutor.email,
            subject: `🎓 New Student Session - Zoom Link Inside`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">📹 You Have a New Tutoring Session!</h2>
                        <p><strong>Student:</strong> ${student.firstName} ${student.lastName}</p>
                        <p><strong>Email:</strong> ${student.email}</p>
                        <p><strong>Subject:</strong> ${requestSubject}</p>
                        <p><strong>Scheduled:</strong> Tomorrow at your preferred time</p>

                        <h3 style="color: #8b4513;">🎥 Zoom Meeting Details (UNIQUE TO THIS SESSION)</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <p><strong>Meeting ID:</strong> ${uniqueZoomId}</p>
                            <p><strong>Password:</strong> ${zoomPassword}</p>
                            <p><strong>Join Link:</strong> <a href="${zoomLink}" style="color: #d4a574; font-weight: bold;">${zoomLink}</a></p>
                        </div>

                        <h3 style="color: #8b4513;">📋 Session Tips:</h3>
                        <ul>
                            <li>✓ Join 5 minutes early to test audio/video</li>
                            <li>✓ Have your screen sharing ready</li>
                            <li>✓ Keep notes on session progress</li>
                            <li>✓ Each session has its own unique Zoom room</li>
                        </ul>

                        <p>Good luck! 🌩️⚡</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(tutorMailOptions, (error, info) => {
            if (error) {
                console.error('❌ Tutor email error:', error);
            } else {
                console.log('✅ Tutor email sent');
            }
        });

        // ===== EMAIL TO STUDENT =====
        const studentMailOptions = {
            from: process.env.EMAIL_USER,
            to: student.email,
            subject: `✅ Tutor ${tutor.firstName} Accepted Your Request!`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">Great News!</h2>
                        <p><strong>${tutor.firstName} ${tutor.lastName}</strong> has accepted your tutoring request!</p>
                        
                        <h3 style="color: #8b4513;">📅 Session Details:</h3>
                        <p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                        <p><strong>Email:</strong> ${tutor.email}</p>
                        <p><strong>Subject:</strong> ${requestSubject}</p>
                        <p><strong>Subjects Taught:</strong> ${tutor.tutorProfile?.subjects?.join(', ') || 'Various'}</p>
                        
                        <h3 style="color: #8b4513;">🎥 Zoom Information (UNIQUE TO YOUR SESSION)</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <p><strong>Meeting ID:</strong> ${uniqueZoomId}</p>
                            <p><strong>Password:</strong> ${zoomPassword}</p>
                            <p><strong>Join Link:</strong> <a href="${zoomLink}" style="color: #d4a574; font-weight: bold;">${zoomLink}</a></p>
                        </div>
                        
                        <h3 style="color: #8b4513;">💻 How to Prepare:</h3>
                        <ul>
                            <li>Make sure you have Zoom installed</li>
                            <li>Test your microphone and camera beforehand</li>
                            <li>Find a quiet place for your session</li>
                            <li>Have your materials ready (books, notes, etc.)</li>
                            <li>Each session has its own unique Zoom room</li>
                        </ul>

                        <p>Looking forward to working with you! 📚⚡</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(studentMailOptions, (error, info) => {
            if (error) {
                console.error('❌ Student email error:', error);
            } else {
                console.log('✅ Student email sent');
            }
        });

        res.json({
            success: true,
            message: 'Request accepted! Zoom links sent to both tutor and student',
            zoomLink: zoomLink,
            zoomMeetingId: uniqueZoomId
        });
    } catch (error) {
        console.error('Error in accept-request:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET TUTOR'S SESSIONS
router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can view their sessions' });
        }

        const sessions = [];
        if (tutor.tutorSessions) {
            for (const session of tutor.tutorSessions) {
                const student = await User.findById(session.studentId);
                if (student) {
                    sessions.push({
                        _id: session._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentEmail: student.email,
                        subject: session.subject || 'Mathematics',
                        scheduledTime: session.scheduledTime,
                        status: session.status,
                        zoomLink: session.zoomLink
                    });
                }
            }
        }

        res.json({
            success: true,
            sessions: sessions.filter(s => new Date(s.scheduledTime) > new Date())
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CHECK TUTOR APPLICATION STATUS (for tutor-pending.html)
router.get('/application-status', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            status: user.tutorApplication?.status || 'not_applied',
            application: user.tutorApplication,
            userType: user.userType
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// COMPLETE A SESSION
router.post('/complete-session', authMiddleware, async (req, res) => {
    try {
        const { sessionId, hoursSpent } = req.body;
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can complete sessions' });
        }

        if (tutor.tutorSessions) {
            tutor.tutorSessions.forEach(session => {
                if (session._id.toString() === sessionId) {
                    session.status = 'completed';
                    session.hoursSpent = hoursSpent || 1;
                    session.completedAt = new Date();
                }
            });
            await tutor.save();
        }

        res.json({
            success: true,
            message: 'Session completed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE TUTOR SPECIALTIES
router.post('/update-specialties', authMiddleware, async (req, res) => {
    try {
        const { subjects } = req.body;
        
        const tutor = await User.findByIdAndUpdate(
            req.user.userId,
            { 'tutorProfile.subjects': subjects },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Specialties updated',
            tutorProfile: tutor.tutorProfile
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET TUTOR STATS
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const tutor = await User.findById(req.user.userId);
        
        const completedSessions = tutor.tutorSessions?.filter(
            s => s.status === 'completed'
        ).length || 0;
        
        const hoursTaught = tutor.tutorSessions?.reduce(
            (sum, s) => sum + (s.hoursSpent || 0), 0
        ) || 0;
        
        res.json({
            success: true,
            rating: 4.9,
            sessionsCompleted: completedSessions,
            hoursTaught: hoursTaught.toFixed(1)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;