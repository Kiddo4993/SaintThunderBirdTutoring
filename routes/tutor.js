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

// APPLY AS TUTOR - SENDS EMAIL FOR APPROVAL
router.post('/apply-tutor', authMiddleware, async (req, res) => {
    try {
        const { name, age } = req.body;

        if (!name || !age) {
            return res.status(400).json({ error: 'Name and age required' });
        }

        // Find user and save tutor application as pending
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

        // Send email to admin
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
                console.log('Email error:', error);
            } else {
                console.log('Email sent:', info.response);
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

// ADMIN: APPROVE TUTOR
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

        // Send approval email to tutor
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `
                <h2>Congratulations ${user.tutorApplication.name}!</h2>
                <p>Your tutor application has been <strong>APPROVED</strong>!</p>
                <p>You can now start tutoring on Saint Thunderbird.</p>
                <p>Welcome to the team! 🚀</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('Email error:', error);
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

// ADMIN: DENY TUTOR
router.get('/deny/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const tutorName = user.tutorApplication?.name || 'Applicant';

        // Delete tutor application
        await User.findByIdAndUpdate(
            userId,
            { $unset: { tutorApplication: 1 } },
            { new: true }
        );

        // Send denial email to applicant
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
            if (error) console.log('Email error:', error);
        });

        res.json({
            success: true,
            message: 'Application denied and email sent!'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE A TUTORING REQUEST (Student)
router.post('/create-request', authMiddleware, async (req, res) => {
    try {
        const { subject, description, priority } = req.body;
        const student = await User.findById(req.user.userId);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Store request in student profile
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
            message: 'Request created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ALL REQUESTS FOR TUTORS IN THEIR SUBJECTS
router.get('/requests', authMiddleware, async (req, res) => {
    try {
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can view requests' });
        }

        const tutorSubjects = tutor.tutorProfile?.subjects || [];

        // Find all students with pending requests in tutor's subjects
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

// ACCEPT A TUTORING REQUEST
router.post('/accept-request', authMiddleware, async (req, res) => {
    try {
        const { requestId, tutorName } = req.body;
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can accept requests' });
        }

        // Create a session
        if (!tutor.tutorSessions) {
            tutor.tutorSessions = [];
        }

        const studentId = requestId.split('-')[0];
        
        tutor.tutorSessions.push({
            studentId: studentId,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'scheduled',
            createdAt: new Date()
        });

        await tutor.save();

        // Also update student's request status and notify them
        const student = await User.findById(studentId);
        if (student && student.tutorRequests) {
            student.tutorRequests.forEach(req => {
                if (req.status === 'pending') {
                    req.status = 'accepted';
                }
            });
            await student.save();
        }

        // Send email to student
        if (student) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: student.email,
                subject: '✅ A Tutor Has Accepted Your Request!',
                html: `
                    <h2>Great News, ${student.firstName}!</h2>
                    <p><strong>${tutorName}</strong> has accepted your tutoring request!</p>
                    <p>Your tutor will be reaching out soon to schedule a session.</p>
                    <p>Get ready to level up your skills! 🚀</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log('Email error:', error);
            });
        }

        res.json({
            success: true,
            message: 'Request accepted, session created'
        });
    } catch (error) {
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
                        subject: 'Mathematics',
                        scheduledTime: session.scheduledTime,
                        status: session.status
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

// GET STUDENT'S SESSIONS
router.get('/student-sessions', authMiddleware, async (req, res) => {
    try {
        const student = await User.findById(req.user.userId);

        if (!student || student.userType !== 'student') {
            return res.status(403).json({ error: 'Only students can view their sessions' });
        }

        // Find tutors who have sessions with this student
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
                            subject: 'Mathematics',
                            scheduledTime: session.scheduledTime,
                            status: session.status
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

        // Find and update session
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

module.exports = router;