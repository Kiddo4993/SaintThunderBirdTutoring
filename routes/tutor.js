const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ADMIN_EMAIL, sendEmail } = require('../services/emailService');
const { sendBiweeklyTutorSummary } = require('../jobs/biweeklyTutorSummary');
const { createSessionMeeting } = require('../services/zoomService');
const router = express.Router();

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5000';

function toDurationLabel(value) {
    const map = {
        '30min': '30 minutes',
        '1hour': '1 hour',
        '1.5hours': '1.5 hours',
        '2hours': '2 hours'
    };
    return map[value] || value || 'Not specified';
}

function durationToHours(value) {
    const map = {
        '30min': 0.5,
        '1hour': 1,
        '1.5hours': 1.5,
        '2hours': 2
    };
    return map[value] || 1;
}

function durationToMinutes(value) {
    return Math.round(durationToHours(value) * 60);
}

async function sendEmailSafe({ to, subject, html, successLog, errorLog }) {
    try {
        await sendEmail({ to, subject, html });
        if (successLog) {
            console.log(successLog);
        }
    } catch (error) {
        console.error(errorLog || '❌ Email error:', error.message);
    }
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

        const approveLink = `${ADMIN_URL}/api/tutor/approve/${user._id}`;
        const denyLink = `${ADMIN_URL}/api/tutor/deny/${user._id}`;

        const mailOptions = {
            to: ADMIN_EMAIL,
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

        sendEmailSafe({
            ...mailOptions,
            successLog: `✅ Application email sent successfully to: ${ADMIN_EMAIL}`,
            errorLog: '❌ Application email error:'
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
            to: user.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `
                <h2>Congratulations ${user.firstName}!</h2>
                <p>Your tutor application has been <strong>APPROVED</strong>!</p>
                <p>You can now start tutoring on Saint Thunderbird.</p>
                <p>Welcome to the team! 🚀</p>
            `
        };

        sendEmailSafe({
            ...mailOptions,
            successLog: `✅ Approval email sent successfully to: ${user.email}`,
            errorLog: '❌ Approval email error:'
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
            to: user.email,
            subject: 'Your Tutor Application Status',
            html: `
                <h2>Tutor Application Update</h2>
                <p>Thank you for applying to become a tutor on Saint Thunderbird.</p>
                <p>Unfortunately, your application has been <strong>DENIED</strong> at this time.</p>
                <p>You can apply again in the future. Thank you for your interest!</p>
            `
        };

        sendEmailSafe({
            ...mailOptions,
            successLog: `✅ Denial email sent successfully to: ${user.email}`,
            errorLog: '❌ Denial email error:'
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
        const { subject, description, priority, requestedTime, selectedTutorId } = req.body;

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

        if (selectedTutorId) {
            const selectedTutor = await User.findOne({
                _id: selectedTutorId,
                userType: 'tutor',
                'tutorApplication.status': 'approved'
            });

            if (!selectedTutor) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected tutor is unavailable'
                });
            }
        }

        if (!student.tutorRequests) {
            student.tutorRequests = [];
        }

        const newRequest = {
            subject,
            description: description || '',
            priority: priority || 'medium',
            requestedTime: requestedTime,
            requestedTutorId: selectedTutorId || undefined,
            createdAt: new Date(),
            status: 'pending'
        };

        student.tutorRequests.push(newRequest);
        await student.save();

        console.log('✅ Request created for student:', student.email, 'Subject:', subject);

        // ===== EMAIL TO ADMIN WHEN STUDENT CREATES REQUEST =====
        const adminMailOptions = {
            to: ADMIN_EMAIL,
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
                            <p><strong>Session Duration:</strong> ${toDurationLabel(requestedTime)}</p>
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

        sendEmailSafe({
            ...adminMailOptions,
            successLog: '✅ Admin notified of new request',
            errorLog: '❌ Admin notification error:'
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
        const hoursLearned = student.studentSessions
            ?.filter((s) => s.status === 'completed')
            .reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0) || 0;

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
                    // Check if request matches tutor's subjects AND time availability
                    // FIXED: Allow 'General' to match everything
                    const hasGeneral = tutorSubjects.some(s => s === 'General' || s === 'General Help');
                    const subjectMatches = hasGeneral || tutorSubjects.includes(req.subject);

                    const requestTutorMatches = !req.requestedTutorId
                        || req.requestedTutorId.toString() === tutor._id.toString();

                    if (req.status === 'pending' && subjectMatches && requestTutorMatches) {
                        requests.push({
                            _id: req._id?.toString() || `${student._id}-${index}`,
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
        const { requestId } = req.body;
        const tutor = await User.findById(req.user.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return res.status(403).json({ error: 'Only tutors can accept requests' });
        }

        if (!tutor.tutorSessions) {
            tutor.tutorSessions = [];
        }

        // Find matching student/request by request subdocument id (primary path)
        let student = await User.findOne({ 'tutorRequests._id': requestId });
        let matchingRequest = null;
        let requestIndex = -1;
        let studentId = null;

        if (student) {
            requestIndex = (student.tutorRequests || []).findIndex(
                (req) => req._id?.toString() === requestId && req.status === 'pending'
            );
            if (requestIndex >= 0) {
                matchingRequest = student.tutorRequests[requestIndex];
                studentId = student._id;
            }
        }

        // Legacy fallback for old IDs: "studentId-index-*"
        if (!matchingRequest) {
            const parts = String(requestId || '').split('-');
            studentId = parts[0];
            requestIndex = parseInt(parts[1], 10);

            if (studentId) {
                student = await User.findById(studentId);
            }

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            if (
                Array.isArray(student.tutorRequests)
                && Number.isInteger(requestIndex)
                && requestIndex >= 0
                && requestIndex < student.tutorRequests.length
            ) {
                const reqAtIndex = student.tutorRequests[requestIndex];
                if (reqAtIndex && reqAtIndex.status === 'pending') {
                    matchingRequest = reqAtIndex;
                }
            }
        }

        if (!student || !matchingRequest) {
            return res.status(404).json({ error: 'Request not found or already accepted' });
        }

        let requestSubject = 'Mathematics';
        let requestedTime = '1hour';
        let plannedHours = 1;

        requestSubject = matchingRequest.subject || 'Mathematics';
        requestedTime = matchingRequest.requestedTime || '1hour';
        plannedHours = durationToHours(requestedTime);

        const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const meeting = await createSessionMeeting({
            topic: `Saint Thunderbird - ${requestSubject} with ${student.firstName}`,
            durationMinutes: durationToMinutes(requestedTime),
            startTime: scheduledTime
        });
        const sessionRefId = meeting.id;
        const zoomPassword = meeting.password || '';
        const zoomLink = meeting.joinUrl;

        // Create session with session reference
        const session = {
            studentId: studentId,
            subject: requestSubject,
            scheduledTime,
            status: 'scheduled',
            createdAt: new Date(),
            zoomMeetingId: sessionRefId,
            zoomPassword: zoomPassword,
            zoomLink: zoomLink, // Placeholder - tutors should coordinate their own meeting link
            plannedHours
        };

        tutor.tutorSessions.push(session);
        await tutor.save();
        const createdTutorSession = tutor.tutorSessions[tutor.tutorSessions.length - 1];

        // Update student request status - use the matching request we found earlier
        matchingRequest.status = 'accepted';
        matchingRequest.acceptedAt = new Date();
        matchingRequest.tutorId = tutor._id;
        await student.save();

        // Also create a session entry for the student (using studentSessions field)
        if (!student.studentSessions) {
            student.studentSessions = [];
        }
        student.studentSessions.push({
            tutorId: tutor._id,
            tutorName: `${tutor.firstName} ${tutor.lastName}`,
            subject: requestSubject,
            scheduledTime,
            status: 'scheduled',
            zoomLink: zoomLink,
            zoomMeetingId: sessionRefId,
            zoomPassword: zoomPassword,
            tutorSessionId: createdTutorSession?._id,
            plannedHours,
            createdAt: new Date()
        });
        await student.save();

        // ===== EMAIL TO TUTOR =====
        const tutorMailOptions = {
            to: tutor.email,
            subject: `🎓 New Student Session - Action Required`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">📹 You Have a New Tutoring Session!</h2>
                        <p><strong>Student:</strong> ${student.firstName} ${student.lastName}</p>
                        <p><strong>Student Email:</strong> <a href="mailto:${student.email}">${student.email}</a></p>
                        <p><strong>Subject:</strong> ${requestSubject}</p>
                        <p><strong>Planned Session Length:</strong> ${toDurationLabel(requestedTime)}</p>
                        <p><strong>Scheduled:</strong> Tomorrow at your preferred time</p>
                        <p><strong>Session Reference:</strong> #${sessionRefId}</p>

                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <h3 style="color: #8b4513; margin-top: 0;">🎥 Session Zoom Link</h3>
                            <p><strong>Join Link:</strong> <a href="${zoomLink}" target="_blank">${zoomLink}</a></p>
                            <p><strong>Meeting ID:</strong> ${sessionRefId}</p>
                            <p><strong>Password:</strong> ${zoomPassword}</p>
                        </div>

                        <h3 style="color: #8b4513;">📋 Next Steps:</h3>
                        <ol style="color: #666; line-height: 1.8;">
                            <li>Coordinate the exact session time with the student</li>
                            <li>Use the Zoom link above for this session</li>
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
        sendEmailSafe({
            ...tutorMailOptions,
            successLog: `✅ Tutor email sent successfully to: ${tutor.email}`,
            errorLog: '❌ Tutor email error:'
        });

        // ===== EMAIL TO STUDENT =====
        const studentMailOptions = {
            to: student.email,
            subject: `✅ Tutor ${tutor.firstName} Accepted Your Request!`,
            html: `
                <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b4513;">🎉 Great News!</h2>
                        <p><strong>${tutor.firstName} ${tutor.lastName}</strong> has accepted your tutoring request!</p>
                        
                        <h3 style="color: #8b4513;">📅 Session Details:</h3>
                        <p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                        <p><strong>Email:</strong> ${tutor.email}</p>
                        <p><strong>Subject:</strong> ${requestSubject}</p>
                        <p><strong>Session Length:</strong> ${toDurationLabel(requestedTime)}</p>
                        <p><strong>Subjects Taught:</strong> ${tutor.tutorProfile?.subjects?.join(', ') || 'Various'}</p>
                        
                        <h3 style="color: #8b4513;">🎥 Zoom Information (UNIQUE TO YOUR SESSION)</h3>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 20px 0;">
                            <p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                            <p><strong>Tutor Email:</strong> <a href="mailto:${tutor.email}">${tutor.email}</a></p>
                            <p><strong>Subject:</strong> ${requestSubject}</p>
                            <p><strong>Session Reference:</strong> #${sessionRefId}</p>
                            <p><strong>Join Link:</strong> <a href="${zoomLink}" target="_blank">${zoomLink}</a></p>
                            <p><strong>Meeting ID:</strong> ${sessionRefId}</p>
                            <p><strong>Password:</strong> ${zoomPassword}</p>
                        </div>
                        
                        <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <h3 style="color: #155724; margin-top: 0;">📧 What Happens Next?</h3>
                            <p style="color: #155724; margin-bottom: 0;">Check your email and dashboard for this Zoom link. Your tutor may also follow up to confirm the exact time.</p>
                        </div>
                        
                        <h3 style="color: #8b4513;">💻 How to Prepare:</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Make sure you have Zoom or Google Meet ready</li>
                            <li>Test your microphone and camera beforehand</li>
                            <li>Find a quiet place for your session</li>
                            <li>Have your materials ready (books, notes, questions)</li>
                            <li>Reply to your tutor's email to confirm the meeting time</li>
                        </ul>

                        <p style="margin-top: 20px;">If you need to reschedule, email your tutor directly at <a href="mailto:${tutor.email}">${tutor.email}</a>.</p>

                        <p>Looking forward to helping you succeed! 📚⚡</p>
                        <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
                    </div>
                </div>
            `
        };
        sendEmailSafe({
            ...studentMailOptions,
            successLog: `✅ Student email sent successfully to: ${student.email}`,
            errorLog: '❌ Student email error:'
        });

        // ===== EMAIL TO ADMIN WHEN REQUEST IS ACCEPTED =====
        const adminMailOptions = {
            to: ADMIN_EMAIL,
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
                        <p><strong>Requested Duration:</strong> ${toDurationLabel(requestedTime)}</p>
                        <p><strong>Scheduled Time:</strong> ${new Date(session.scheduledTime).toLocaleString()}</p>
                        <p><strong>Session Reference:</strong> #${sessionRefId}</p>
                        
                        <p style="margin-top: 20px; color: #888; font-size: 12px;">
                            Session hours will be tracked individually for each user.
                        </p>
                    </div>
                </div>
            `
        };
        sendEmailSafe({
            ...adminMailOptions,
            successLog: '✅ Admin notification sent for new session',
            errorLog: '❌ Admin notification error:'
        });

        res.json({
            success: true,
            message: 'Request accepted! Session created and Zoom link emailed to both tutor and student.',
            sessionRefId: sessionRefId,
            tutorEmail: tutor.email,
            zoomLink
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
        const parsedHours = Number(hoursSpent);

        if (tutor.tutorSessions) {
            tutor.tutorSessions.forEach(session => {
                if (session._id.toString() === sessionId) {
                    session.status = 'completed';
                    session.hoursSpent = Number.isFinite(parsedHours) && parsedHours > 0
                        ? parsedHours
                        : Number(session.plannedHours || 1);
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
                        const exactMatch = session.tutorSessionId
                            && session.tutorSessionId.toString() === completedSession._id.toString();
                        const fallbackMatch = !session.tutorSessionId
                            && session.tutorId
                            && session.tutorId.toString() === tutor._id.toString()
                            && session.subject === completedSession.subject
                            && session.status === 'scheduled';

                        if (exactMatch || fallbackMatch) {
                            session.status = 'completed';
                            session.hoursSpent = completedSession.hoursSpent;
                            session.completedAt = new Date();
                        }
                    });
                    await student.save();
                }
            }
        }

        // ===== EMAIL TO ADMIN WITH INDIVIDUAL USER DATA =====
        if (completedSession && student) {
            const tutorCompletedSessions = tutor.tutorSessions?.filter((s) => s.status === 'completed') || [];
            const tutorCompletedHours = tutorCompletedSessions.reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0);
            const studentCompletedSessions = student.studentSessions?.filter((s) => s.status === 'completed') || [];
            const studentCompletedHours = studentCompletedSessions.reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0);

            const adminMailOptions = {
                to: ADMIN_EMAIL,
                subject: `📊 Session Completed - ${tutor.firstName} ${tutor.lastName} & ${student.firstName} ${student.lastName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #8b4513;">📊 Session Completed - Individual Tracking</h2>
                            
                            <h3 style="color: #8b4513; margin-top: 20px;">👨‍🏫 Tutor Information:</h3>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                                <p><strong>Name:</strong> ${tutor.firstName} ${tutor.lastName}</p>
                                <p><strong>Email:</strong> ${tutor.email}</p>
                                <p><strong>Total Hours Taught (This Tutor):</strong> ${tutorCompletedHours.toFixed(1)} hours</p>
                                <p><strong>Total Sessions Completed (This Tutor):</strong> ${tutorCompletedSessions.length}</p>
                            </div>

                            <h3 style="color: #8b4513; margin-top: 20px;">👨‍🎓 Student Information:</h3>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                                <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
                                <p><strong>Email:</strong> ${student.email}</p>
                                <p><strong>Total Hours Learned (This Student):</strong> ${studentCompletedHours.toFixed(1)} hours</p>
                                <p><strong>Total Sessions Completed (This Student):</strong> ${studentCompletedSessions.length}</p>
                            </div>

                            <h3 style="color: #8b4513; margin-top: 20px;">📝 Session Details:</h3>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 10px 0;">
                                <p><strong>Subject:</strong> ${completedSession.subject || 'N/A'}</p>
                                <p><strong>Hours Spent:</strong> ${completedSession.hoursSpent} hour(s)</p>
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

            sendEmailSafe({
                ...adminMailOptions,
                successLog: '✅ Admin notification sent successfully',
                errorLog: '❌ Admin email error:'
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

        const hoursTaught = tutor.tutorSessions
            ?.filter((s) => s.status === 'completed')
            .reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0) || 0;

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
        if (user.email !== ADMIN_EMAIL) {
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

// ADMIN DASHBOARD SUMMARY COUNTS
router.get('/admin-summary', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Unauthorized: Admin access only' });
        }

        const [pendingCount, approvedCount, totalApplications] = await Promise.all([
            User.countDocuments({ 'tutorApplication.status': 'pending' }),
            User.countDocuments({ 'tutorApplication.status': 'approved', userType: 'tutor' }),
            User.countDocuments({ tutorApplication: { $exists: true } })
        ]);

        res.json({
            success: true,
            pendingCount,
            approvedCount,
            totalApplications
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. APPROVE TUTOR (Via Admin Panel Button)
router.post('/approve-tutor/:userId', authMiddleware, async (req, res) => {
    try {
        // Security Check
        const admin = await User.findById(req.user.userId);
        if (admin.email !== ADMIN_EMAIL) {
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
            availability: existingProfile.availability || '',
            motivation: existingProfile.motivation || '',
            experience: existingProfile.experience || '',
            availableTimes: existingProfile.availableTimes || [],
            educationLevel: existingProfile.educationLevel || ''
        };

        const user = await User.findByIdAndUpdate(
            userId,
            {
                userType: 'tutor', // CRITICAL: This changes them from 'student' to 'tutor'
                'tutorApplication.status': 'approved',
                'tutorApplication.approvedAt': new Date(),
                tutorProfile: updatedProfile
            },
            { new: true }
        );

        sendEmailSafe({
            to: targetUser.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `
                <h2>Congratulations ${targetUser.firstName}!</h2>
                <p>Your tutor application has been <strong>APPROVED</strong>.</p>
                <p>You can now log in and start tutoring.</p>
            `,
            successLog: `✅ Approval email sent successfully to: ${targetUser.email}`,
            errorLog: '❌ Approval email error:'
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
        if (admin.email !== ADMIN_EMAIL) {
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

        sendEmailSafe({
            to: targetUser.email,
            subject: 'Your Tutor Application Status',
            html: `
                <h2>Tutor Application Update</h2>
                <p>Thank you for applying to become a tutor on Saint Thunderbird.</p>
                <p>Unfortunately, your application has been <strong>DENIED</strong> at this time.</p>
                <p>You can apply again in the future.</p>
            `,
            successLog: `✅ Denial email sent successfully to: ${targetUser.email}`,
            errorLog: '❌ Denial email error:'
        });

        res.json({ success: true, message: 'Application denied and email sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. MANUAL ADMIN TRIGGER FOR BIWEEKLY SUMMARY EMAIL
router.post('/admin/send-biweekly-summary', authMiddleware, async (req, res) => {
    try {
        const admin = await User.findById(req.user.userId);
        if (!admin || admin.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await sendBiweeklyTutorSummary({ force: true });
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
