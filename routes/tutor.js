const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();

// Setup email transporter with better error handling
let transporter;

try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD // Should be an App Password, not regular password
        },
        // Add timeout and retry options
        pool: true,
        maxConnections: 1,
        maxMessages: 3
    });

    // Verify transporter is working
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email transporter error:', error.message);
            console.error('💡 Make sure EMAIL_USER and EMAIL_PASSWORD are set in environment variables');
            console.error('💡 For Gmail, use an App Password (not your regular password)');
        } else {
            console.log('✅ Email transporter ready');
        }
    });
} catch (error) {
    console.error('❌ FAILED TO CREATE EMAIL TRANSPORTER:', error.message);
    console.error('💡 This usually means your EMAIL_USER or EMAIL_PASSWORD in .env is incorrect.');
    console.error('💡 Double check you are using an "App Password" for Gmail, not your login password.');
    console.error('💡 Full error:', error);

    // Create a dummy transporter to prevent crashes
    transporter = {
        sendMail: (options, callback) => {
            console.error('❌ [EMAIL FAILED] Email service not configured properly.');
            console.error('   Attempted to send to:', options.to);
            console.error('   Subject:', options.subject);
            if (callback) callback(new Error('Email transporter not configured properly. Check server logs.'), null);
        }
    };
}

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
                console.error('❌ Application email error:', error.message);
                console.error('Full error:', error);
            } else {
                console.log('✅ Application email sent successfully to:', 'dylanduancanada@gmail.com');
                console.log('Message ID:', info.messageId);
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
            if (error) {
                console.error('❌ Approval email error:', error.message);
                console.error('Full error:', error);
            } else {
                console.log('✅ Approval email sent successfully to:', user.email);
            }
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
            if (error) {
                console.error('❌ Denial email error:', error.message);
                console.error('Full error:', error);
            } else {
                console.log('✅ Denial email sent successfully to:', user.email);
            }
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
        const { subject, description, priority, requestedTime } = req.body;

        // Validate required fields
        if (!subject) {
            return res.status(400).json({
                success: false,
                error: 'Subject is required'
            });
        }

        if (!requestedTime) {
            return res.status(400).json({
                success: false,
                error: 'Session duration is required'
            });
        }

        const student = await User.findById(req.user.userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        if (student.userType !== 'student') {
            return res.status(403).json({
                success: false,
                error: 'Only students can create requests'
            });
        }

        if (!student.tutorRequests) {
            student.tutorRequests = [];
        }

        const newRequest = {
            subject,
            description: description || '',
            priority: priority || 'medium',
            requestedTime: requestedTime,
            createdAt: new Date(),
            status: 'pending'
        };

        student.tutorRequests.push(newRequest);
        await student.save();

        console.log('✅ Request created for student:', student.email, 'Subject:', subject);

        // ===== EMAIL TO ADMIN WHEN STUDENT CREATES REQUEST =====
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: 'dylanduancanada@gmail.com',
            subject: `📝 New Tutoring Request - ${student.firstName} ${student.lastName}`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">📝 New Tutoring Request</h2>
                        
                        <h3 style="color: #8b4513; margin-top: 20px;">👨‍🎓 Student Information:</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                            <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
                            <p><strong>Email:</strong> ${student.email}</p>
                            <p><strong>Total Requests Made (This Student):</strong> ${student.tutorRequests?.length || 0}</p>
                            <p><strong>Total Hours Learned (This Student):</strong> ${(student.studentSessions?.reduce((sum, s) => sum + (s.hoursSpent || 0), 0) || 0).toFixed(1)} hours</p>
                        </div>

                        <h3 style="color: #8b4513; margin-top: 20px;">📚 Request Details:</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Session Duration:</strong> ${requestedTime === '30min' ? '30 minutes' : requestedTime === '1hour' ? '1 hour' : requestedTime === '1.5hours' ? '1.5 hours' : requestedTime === '2hours' ? '2 hours' : requestedTime}</p>
                            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
                            <p><strong>Priority:</strong> ${priority || 'medium'}</p>
                            <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
                        </div>

                        <p style="margin-top: 20px; color: #888; font-size: 12px;">
                            Waiting for a tutor to accept this request. Hours will be tracked individually for this student.
                        </p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(adminMailOptions, (error, info) => {
            if (error) {
                console.error('❌ Admin notification error:', error.message);
            } else {
                console.log('✅ Admin notified of new request');
            }
        });

        res.json({
            success: true,
            message: 'Request created successfully',
            request: newRequest
        });
    } catch (error) {
        console.error('❌ Error creating request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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
// GET AVAILABLE TUTORS (for students)
router.get('/available-tutors', authMiddleware, async (req, res) => {
    try {
        // UPDATED: Only show tutors who are explicitly APPROVED
        const tutors = await User.find({
            userType: 'tutor',
            'tutorApplication.status': 'approved'
        });

        const availableTutors = tutors.map(tutor => ({
            _id: tutor._id,
            firstName: tutor.firstName,
            lastName: tutor.lastName,
            email: tutor.email,
            // Add safety check (|| {}) in case profile is empty
            tutorProfile: tutor.tutorProfile || { subjects: [], bio: '' }
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

        const sessions = [];

        // Get sessions from student's studentSessions array
        if (student.studentSessions && student.studentSessions.length > 0) {
            for (const session of student.studentSessions) {
                // Get tutor info
                const tutor = await User.findById(session.tutorId);
                if (tutor) {
                    sessions.push({
                        _id: session._id,
                        tutorName: session.tutorName || `${tutor.firstName} ${tutor.lastName}`,
                        tutorEmail: tutor.email,
                        subject: session.subject || 'Mathematics',
                        scheduledTime: session.scheduledTime,
                        status: session.status,
                        zoomLink: session.zoomLink,
                        zoomMeetingId: session.zoomMeetingId,
                        zoomPassword: session.zoomPassword
                    });
                }
            }
        }

        // Also check tutor sessions for backward compatibility
        const tutors = await User.find({ userType: 'tutor' });
        for (const tutor of tutors) {
            if (tutor.tutorSessions) {
                tutor.tutorSessions.forEach(session => {
                    if (session.studentId.toString() === student._id.toString()) {
                        // Check if we already have this session
                        const exists = sessions.find(s => s._id && s._id.toString() === session._id.toString());
                        if (!exists) {
                            sessions.push({
                                _id: session._id,
                                tutorName: `${tutor.firstName} ${tutor.lastName}`,
                                tutorEmail: tutor.email,
                                subject: session.subject || 'Mathematics',
                                scheduledTime: session.scheduledTime,
                                status: session.status,
                                zoomLink: session.zoomLink,
                                zoomMeetingId: session.zoomMeetingId,
                                zoomPassword: session.zoomPassword
                            });
                        }
                    }
                });
            }
        }

        res.json({
            success: true,
            sessions: sessions
                .filter(s => new Date(s.scheduledTime) > new Date())
                .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
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

        // Count completed sessions
        const completedSessions = student.studentSessions?.filter(s =>
            s.status === 'completed'
        ).length || 0;

        // Calculate hours learned from completed sessions
        const hoursLearned = student.studentSessions?.reduce((sum, s) =>
            sum + (s.hoursSpent || 0), 0
        ) || 0;

        res.json({
            success: true,
            requestsMade,
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
            if (student.tutorRequests && Array.isArray(student.tutorRequests)) {
                student.tutorRequests.forEach((req, index) => {
                    // Check if request matches tutor's subjects
                    const subjectMatches = tutorSubjects.includes(req.subject);

                    if (req.status === 'pending' && subjectMatches) {
                        // Create a reliable requestId using studentId and request index
                        const requestId = `${student._id}-${index}-${req.createdAt ? new Date(req.createdAt).getTime() : Date.now()}`;
                        requests.push({
                            _id: requestId,
                            studentId: student._id,
                            requestIndex: index, // Store index for easier lookup
                            studentName: `${student.firstName} ${student.lastName}`,
                            studentEmail: student.email,
                            grade: student.grade || 'N/A',
                            subject: req.subject,
                            description: req.description,
                            priority: req.priority,
                            requestedTime: req.requestedTime,
                            createdAt: req.createdAt
                        });
                    }
                });
            }
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

        // Parse requestId format: "studentId-index-timestamp"
        const parts = requestId.split('-');
        const studentId = parts[0];
        const requestIndex = parseInt(parts[1]); // Get the index from requestId

        const student = await User.findById(studentId);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Find the specific request using the index
        let matchingRequest = null;
        let requestSubject = 'Mathematics';

        if (student.tutorRequests && Array.isArray(student.tutorRequests) && student.tutorRequests.length > 0) {
            // Use index if valid, otherwise find first pending request
            if (!isNaN(requestIndex) && requestIndex >= 0 && requestIndex < student.tutorRequests.length) {
                const req = student.tutorRequests[requestIndex];
                if (req && req.status === 'pending') {
                    matchingRequest = req;
                }
            }

            // Fallback: find first pending request
            if (!matchingRequest) {
                matchingRequest = student.tutorRequests.find(req => req.status === 'pending');
            }

            if (matchingRequest) {
                requestSubject = matchingRequest.subject || 'Mathematics';
            }
        }

        // Generate session reference ID for coordination
        // NOTE: This is a placeholder - tutors should create their own Zoom/Google Meet link
        const sessionRefId = Math.floor(Math.random() * 9000000000) + 1000000000;
        const zoomPassword = 'Tutoring2025';
        // This is a placeholder link - tutors should create their own meeting
        const zoomLink = `https://zoom.us/j/${sessionRefId}?pwd=${zoomPassword}`;

        // Create session with session reference
        const session = {
            studentId: studentId,
            subject: requestSubject,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'scheduled',
            createdAt: new Date(),
            zoomMeetingId: sessionRefId,
            zoomPassword: zoomPassword,
            zoomLink: zoomLink // Placeholder - tutors should coordinate their own meeting link
        };

        tutor.tutorSessions.push(session);
        await tutor.save();

        // Update student request status - use the matching request we found earlier
        if (matchingRequest) {
            matchingRequest.status = 'accepted';
            matchingRequest.acceptedAt = new Date();
            matchingRequest.tutorId = tutor._id;
            await student.save();
        } else {
            console.warn('⚠️ No matching request found to update status');
        }

        // Also create a session entry for the student (using studentSessions field)
        if (!student.studentSessions) {
            student.studentSessions = [];
        }
        student.studentSessions.push({
            tutorId: tutor._id,
            tutorName: `${tutor.firstName} ${tutor.lastName}`,
            subject: requestSubject,
            scheduledTime: session.scheduledTime,
            status: 'scheduled',
            zoomLink: zoomLink,
            zoomMeetingId: sessionRefId,
            zoomPassword: zoomPassword,
            createdAt: new Date()
        });
        await student.save();

        // ===== EMAIL TO TUTOR =====
        const tutorMailOptions = {
            from: process.env.EMAIL_USER,
            to: tutor.email,
            subject: `🎓 New Student Session - Action Required`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">📹 You Have a New Tutoring Session!</h2>
                        <p><strong>Student:</strong> ${student.firstName} ${student.lastName}</p>
                        <p><strong>Student Email:</strong> <a href="mailto:${student.email}">${student.email}</a></p>
                        <p><strong>Subject:</strong> ${requestSubject}</p>
                        <p><strong>Session Reference:</strong> #${sessionRefId}</p>

                        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <h3 style="color: #856404; margin-top: 0;">⚠️ Important: Set Up Your Meeting</h3>
                            <p style="color: #856404; margin-bottom: 0;">Please create your own Zoom or Google Meet link and email it directly to the student at <strong>${student.email}</strong>.</p>
                        </div>

                        <h3 style="color: #8b4513;">📋 Next Steps:</h3>
                        <ol style="color: #666; line-height: 1.8;">
                            <li>Create a Zoom meeting or Google Meet link</li>
                            <li>Email the meeting link to the student: <a href="mailto:${student.email}">${student.email}</a></li>
                            <li>Coordinate a time that works for both of you</li>
                            <li>Join 5 minutes early to test audio/video</li>
                            <li>After the session, mark it as complete in your dashboard</li>
                        </ol>

                        <h3 style="color: #8b4513;">💡 Session Tips:</h3>
                        <ul style="color: #666;">
                            <li>Have your screen sharing ready</li>
                            <li>Keep notes on session progress</li>
                            <li>Be patient and encouraging</li>
                            <li>Track your hours for volunteer credit</li>
                        </ul>

                        <p>Good luck with your session! 🌩️⚡</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(tutorMailOptions, (error, info) => {
            if (error) {
                console.error('❌ Tutor email error:', error.message);
                console.error('Full error:', error);
            } else {
                console.log('✅ Tutor email sent successfully to:', tutor.email);
                console.log('Message ID:', info.messageId);
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
                        <h2 style="color: #8b4513;">🎉 Great News!</h2>
                        <p><strong>${tutor.firstName} ${tutor.lastName}</strong> has accepted your tutoring request!</p>
                        
                        <h3 style="color: #8b4513;">📅 Session Details:</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                            <p><strong>Tutor Email:</strong> <a href="mailto:${tutor.email}">${tutor.email}</a></p>
                            <p><strong>Subject:</strong> ${requestSubject}</p>
                            <p><strong>Session Reference:</strong> #${sessionRefId}</p>
                        </div>
                        
                        <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <h3 style="color: #155724; margin-top: 0;">📧 What Happens Next?</h3>
                            <p style="color: #155724; margin-bottom: 0;">Your tutor will email you directly with a Zoom or Google Meet link. Keep an eye on your inbox for a message from <strong>${tutor.email}</strong>.</p>
                        </div>
                        
                        <h3 style="color: #8b4513;">💻 How to Prepare:</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Make sure you have Zoom or Google Meet ready</li>
                            <li>Test your microphone and camera beforehand</li>
                            <li>Find a quiet place for your session</li>
                            <li>Have your materials ready (books, notes, questions)</li>
                            <li>Reply to your tutor's email to confirm the meeting time</li>
                        </ul>

                        <p style="margin-top: 20px;">If you don't hear from your tutor within 24 hours, feel free to email them directly at <a href="mailto:${tutor.email}">${tutor.email}</a>.</p>

                        <p>Looking forward to helping you succeed! 📚⚡</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(studentMailOptions, (error, info) => {
            if (error) {
                console.error('❌ Student email error:', error.message);
                console.error('Full error:', error);
            } else {
                console.log('✅ Student email sent successfully to:', student.email);
                console.log('Message ID:', info.messageId);
            }
        });

        // ===== EMAIL TO ADMIN WHEN REQUEST IS ACCEPTED =====
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: 'dylanduancanada@gmail.com',
            subject: `🔔 New Session Created - ${tutor.firstName} ${tutor.lastName} & ${student.firstName} ${student.lastName}`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">🔔 New Tutoring Session Created</h2>
                        
                        <h3 style="color: #8b4513; margin-top: 20px;">👨‍🏫 Tutor:</h3>
                        <p><strong>Name:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                        <p><strong>Email:</strong> ${tutor.email}</p>
                        
                        <h3 style="color: #8b4513; margin-top: 20px;">👨‍🎓 Student:</h3>
                        <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
                        <p><strong>Email:</strong> ${student.email}</p>
                        
                        <h3 style="color: #8b4513; margin-top: 20px;">📚 Session Details:</h3>
                        <p><strong>Subject:</strong> ${requestSubject}</p>
                        <p><strong>Scheduled Time:</strong> ${new Date(session.scheduledTime).toLocaleString()}</p>
                        <p><strong>Session Reference:</strong> #${sessionRefId}</p>
                        
                        <p style="margin-top: 20px; color: #888; font-size: 12px;">
                            Session hours will be tracked individually for each user.
                        </p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(adminMailOptions, (error, info) => {
            if (error) {
                console.error('❌ Admin notification error:', error.message);
            } else {
                console.log('✅ Admin notification sent for new session');
            }
        });

        res.json({
            success: true,
            message: 'Request accepted! Session created - tutor will contact student with meeting link.',
            sessionRefId: sessionRefId,
            tutorEmail: tutor.email
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
                        zoomLink: session.zoomLink,
                        hoursSpent: session.hoursSpent,
                        completedAt: session.completedAt
                    });
                }
            }
        }

        // Return ALL sessions (not just upcoming) so tutors can see and complete past sessions
        res.json({
            success: true,
            sessions: sessions.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime))
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

        let completedSession = null;
        let student = null;

        if (tutor.tutorSessions) {
            tutor.tutorSessions.forEach(session => {
                if (session._id.toString() === sessionId) {
                    session.status = 'completed';
                    session.hoursSpent = hoursSpent || 1;
                    session.completedAt = new Date();
                    completedSession = session;
                }
            });
            await tutor.save();

            // Also update student's session
            if (completedSession) {
                student = await User.findById(completedSession.studentId);
                if (student && student.studentSessions) {
                    student.studentSessions.forEach(session => {
                        if (session.tutorId && session.tutorId.toString() === tutor._id.toString() &&
                            session.subject === completedSession.subject &&
                            session.status === 'scheduled') {
                            session.status = 'completed';
                            session.hoursSpent = hoursSpent || 1;
                            session.completedAt = new Date();
                        }
                    });
                    await student.save();
                }
            }
        }

        // ===== EMAIL TO ADMIN WITH INDIVIDUAL USER DATA =====
        if (completedSession && student) {
            const adminMailOptions = {
                from: process.env.EMAIL_USER,
                to: 'dylanduancanada@gmail.com',
                subject: `📊 Session Completed - ${tutor.firstName} ${tutor.lastName} & ${student.firstName} ${student.lastName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #8b4513;">📊 Session Completed - Individual Tracking</h2>
                            
                            <h3 style="color: #8b4513; margin-top: 20px;">👨‍🏫 Tutor Information:</h3>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                                <p><strong>Name:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                                <p><strong>Email:</strong> ${tutor.email}</p>
                                <p><strong>Total Hours Taught (This Tutor):</strong> ${(tutor.tutorSessions?.reduce((sum, s) => sum + (s.hoursSpent || 0), 0) || 0).toFixed(1)} hours</p>
                                <p><strong>Total Sessions Completed (This Tutor):</strong> ${tutor.tutorSessions?.filter(s => s.status === 'completed').length || 0}</p>
                            </div>

                            <h3 style="color: #8b4513; margin-top: 20px;">👨‍🎓 Student Information:</h3>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                                <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
                                <p><strong>Email:</strong> ${student.email}</p>
                                <p><strong>Total Hours Learned (This Student):</strong> ${(student.studentSessions?.reduce((sum, s) => sum + (s.hoursSpent || 0), 0) || 0).toFixed(1)} hours</p>
                                <p><strong>Total Sessions Completed (This Student):</strong> ${student.studentSessions?.filter(s => s.status === 'completed').length || 0}</p>
                            </div>

                            <h3 style="color: #8b4513; margin-top: 20px;">📝 Session Details:</h3>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                                <p><strong>Subject:</strong> ${completedSession.subject || 'N/A'}</p>
                                <p><strong>Hours Spent:</strong> ${hoursSpent || 1} hour(s)</p>
                                <p><strong>Completed At:</strong> ${new Date().toLocaleString()}</p>
                                <p><strong>Scheduled Time:</strong> ${completedSession.scheduledTime ? new Date(completedSession.scheduledTime).toLocaleString() : 'N/A'}</p>
                            </div>

                            <p style="margin-top: 20px; color: #888; font-size: 12px;">
                                This is an automated notification from Saint Thunderbird Tutoring Platform.<br>
                                Each user's hours are tracked individually.
                            </p>
                        </div>
                    </div>
                `
            };

            transporter.sendMail(adminMailOptions, (error, info) => {
                if (error) {
                    console.error('❌ Admin email error:', error.message);
                } else {
                    console.log('✅ Admin notification sent successfully');
                }
            });
        }

        res.json({
            success: true,
            message: 'Session completed and admin notified'
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
// ==========================================
// ADMIN PANEL ROUTES
// ==========================================

// 1. GET ALL PENDING APPLICATIONS
router.get('/pending-applications', authMiddleware, async (req, res) => {
    try {
        // Security Check: Only Dylan can see this
        const user = await User.findById(req.user.userId);
        if (user.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Unauthorized: Admin access only' });
        }

        const applications = await User.find({
            'tutorApplication.status': 'pending'
        });

        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. APPROVE TUTOR (Via Admin Panel Button)
router.post('/approve-tutor/:userId', authMiddleware, async (req, res) => {
    try {
        // Security Check
        const admin = await User.findById(req.user.userId);
        if (admin.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { userId } = req.params;

        // Fetch user first to get application data
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Preserve existing tutorProfile data from signup, only fill in missing fields
        const existingProfile = targetUser.tutorProfile || {};
        const updatedProfile = {
            subjects: existingProfile.subjects || ['General'],
            bio: existingProfile.bio || "I am ready to help!",
            availability: existingProfile.availability,
            motivation: existingProfile.motivation,
            experience: existingProfile.experience,
            availableTimes: existingProfile.availableTimes || [],
            education: existingProfile.education
        };

        const user = await User.findByIdAndUpdate(
            userId,
            {
                userType: 'tutor', // CRITICAL: This changes them from 'student' to 'tutor'
                'tutorApplication.status': 'approved',
                'tutorApplication.approvedAt': new Date(),
                'tutorProfile': updatedProfile
            },
            { new: true }
        );

        // Send approval email to the tutor
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">🎉 Congratulations ${user.firstName}!</h2>
                        <p>Your tutor application has been <strong style="color: #22c55e;">APPROVED</strong>!</p>
                        <p>You can now log in to your tutor dashboard and start helping students.</p>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <h3 style="color: #8b4513; margin-top: 0;">Next Steps:</h3>
                            <ul style="color: #666;">
                                <li>Log in at the Saint Thunderbird website</li>
                                <li>Use the "Tutor" tab to access your dashboard</li>
                                <li>Wait for student requests to appear</li>
                                <li>Accept requests and help students succeed!</li>
                            </ul>
                        </div>
                        
                        <p>Welcome to the Saint Thunderbird tutoring team! ⚡</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Approval email error:', error.message);
            } else {
                console.log('✅ Approval email sent to:', user.email);
            }
        });

        res.json({ success: true, message: 'Tutor approved and email sent!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. DENY TUTOR (Via Admin Panel Button)
router.post('/deny-tutor/:userId', authMiddleware, async (req, res) => {
    try {
        // Security Check
        const admin = await User.findById(req.user.userId);
        if (admin.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { userId } = req.params;
        const { reason } = req.body; // Optional denial reason

        // Get user info before updating
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update application status to denied (don't remove it completely so they can see why)
        await User.findByIdAndUpdate(
            userId,
            { 
                'tutorApplication.status': 'denied',
                'tutorApplication.deniedAt': new Date(),
                'tutorApplication.denialReason': reason || 'No reason provided'
            }
        );

        // Send denial email to the applicant
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: targetUser.email,
            subject: 'Update on Your Tutor Application - Saint Thunderbird',
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">Tutor Application Update</h2>
                        <p>Dear ${targetUser.firstName},</p>
                        <p>Thank you for your interest in becoming a tutor at Saint Thunderbird.</p>
                        <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
                        
                        ${reason ? `
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <p><strong>Reason:</strong> ${reason}</p>
                        </div>
                        ` : ''}
                        
                        <p>You are still welcome to use Saint Thunderbird as a student. If you believe this decision was made in error, please contact us at dylanduancanada@gmail.com.</p>
                        
                        <p>Thank you for your understanding.</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Denial email error:', error.message);
            } else {
                console.log('✅ Denial email sent to:', targetUser.email);
            }
        });

        res.json({ success: true, message: 'Application denied and email sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;