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

        // Count upcoming sessions from studentSessions array
        const upcomingSessions = student.studentSessions?.filter(s =>
            s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
        ).length || 0;

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
        const tutorAvailableTimes = tutor.tutorProfile?.availableTimes || [];

        const students = await User.find({
            userType: 'student',
            'tutorRequests': { $exists: true }
        });

        const requests = [];
        students.forEach(student => {
            if (student.tutorRequests && Array.isArray(student.tutorRequests)) {
                student.tutorRequests.forEach((req, index) => {
                    // Check if request matches tutor's subjects AND time availability
                    const subjectMatches = tutorSubjects.includes(req.subject);
                    const timeMatches = tutorAvailableTimes.length === 0 || tutorAvailableTimes.includes(req.requestedTime);

                    if (req.status === 'pending' && subjectMatches && timeMatches) {
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

        // Generate UNIQUE Zoom meeting ID for THIS session
        const uniqueZoomId = Math.floor(Math.random() * 9000000000) + 1000000000;
        const zoomPassword = 'Tutoring2025';
        const zoomLink = `https://zoom.us/j/${uniqueZoomId}?pwd=${zoomPassword}`;

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
            zoomMeetingId: uniqueZoomId,
            zoomPassword: zoomPassword,
            createdAt: new Date()
        });
        await student.save();

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
                        <p><strong>Zoom Meeting ID:</strong> ${uniqueZoomId}</p>
                        
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
        const user = await User.findByIdAndUpdate(
            userId,
            {
                userType: 'tutor',
                'tutorApplication.status': 'approved',
                'tutorApplication.approvedAt': new Date(),
                // Initialize default profile if empty
                'tutorProfile': {
                    subjects: user.tutorApplication?.subjects || ['General'],
                    bio: "I am ready to help!"
                }
            },
            { new: true }
        );

        res.json({ success: true, message: 'Approved successfully' });
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
        await User.findByIdAndUpdate(
            userId,
            { $unset: { tutorApplication: 1 } } // Removes the application
        );

        res.json({ success: true, message: 'Application denied' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;