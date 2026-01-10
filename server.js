require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Import Models
const User = require('./models/User');
const Request = require('./models/Request');
const Session = require('./models/Session');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. EMAIL CONFIGURATION (Gmail) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Set this in your .env file
        pass: process.env.EMAIL_PASS  // Set this in your .env file
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"Saint Thunderbird" <${process.env.EMAIL_USER}>`,
            to, subject, text
        });
        console.log(`📧 Email sent to ${to}`);
    } catch (err) {
        console.error('Email failed:', err);
    }
};

// --- 2. DATABASE ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// --- 3. MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// --- 4. AUTH ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userType } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Tutors are pending by default
        const status = userType === 'tutor' ? 'pending' : 'active';

        const user = new User({ 
            firstName, lastName, email, 
            password: hashedPassword, 
            userType, status 
        });
        await user.save();

        if (userType === 'tutor') {
            sendEmail(email, 'Application Received', 'Your application to Saint Thunderbird is pending approval.');
            sendEmail('dylanduancanada@gmail.com', 'New Tutor Application', `${firstName} has applied to be a tutor.`);
        }

        const token = jwt.sign({ _id: user._id, userType: user.userType }, process.env.JWT_SECRET || 'secret');
        res.json({ success: true, token, user });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });

        if (user.status === 'pending') return res.status(403).json({ error: 'Account pending approval' });
        if (user.status === 'denied') return res.status(403).json({ error: 'Account denied' });

        const token = jwt.sign({ _id: user._id, userType: user.userType }, process.env.JWT_SECRET || 'secret');
        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current User
app.get('/api/auth/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
});

// --- 5. ADMIN ROUTES ---

app.get('/api/auth/pending-applications', verifyToken, async (req, res) => {
    const pending = await User.find({ userType: 'tutor', status: 'pending' });
    res.json({ success: true, applications: pending });
});

app.post('/api/auth/approve-tutor/:id', verifyToken, async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    sendEmail(user.email, 'Application Approved! 🎉', 'You are now an active tutor at Saint Thunderbird. Login to start teaching.');
    res.json({ success: true });
});

app.post('/api/auth/deny-tutor/:id', verifyToken, async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'denied' });
    res.json({ success: true });
});

// --- 6. STUDENT ROUTES ---

// Create a Help Request
app.post('/api/tutor/create-request', verifyToken, async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        const newRequest = new Request({
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            subject: req.body.subject,
            description: req.body.description,
            priority: req.body.priority
        });
        await newRequest.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Student's Requests
app.get('/api/tutor/my-requests', verifyToken, async (req, res) => {
    const requests = await Request.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
});

// Get Student's Upcoming Sessions
app.get('/api/tutor/student-sessions', verifyToken, async (req, res) => {
    const sessions = await Session.find({ studentId: req.user._id }).sort({ scheduledTime: 1 });
    res.json({ success: true, sessions });
});

// --- 7. TUTOR ROUTES ---

// Get All Open Requests (For Tutor Dashboard)
app.get('/api/tutor/requests', verifyToken, async (req, res) => {
    // Tutors see all pending requests
    const requests = await Request.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests); // Return array directly
});

// Accept Request & Create Session (Generates Zoom Link)
app.post('/api/tutor/accept-request', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.body;
        const tutor = await User.findById(req.user._id);
        const request = await Request.findById(requestId);
        const student = await User.findById(request.studentId);

        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Update Request Status
        request.status = 'accepted';
        await request.save();

        // GENERATE ZOOM LINK (Simulated)
        const zoomLink = `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        // Scheduled for tomorrow same time (Simple logic)
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + 1);

        // Create Session
        const session = new Session({
            tutorId: tutor._id,
            tutorName: `${tutor.firstName} ${tutor.lastName}`,
            tutorEmail: tutor.email,
            studentId: student._id,
            studentName: student.firstName, // Assuming request has name, but getting from DB is safer
            studentEmail: student.email,
            subject: request.subject,
            zoomLink: zoomLink,
            scheduledTime: scheduledTime
        });
        await session.save();

        // Email both parties
        const emailMsg = `Session Confirmed!\nSubject: ${request.subject}\nZoom Link: ${zoomLink}\nTime: ${scheduledTime}`;
        sendEmail(student.email, 'Tutoring Session Confirmed', emailMsg);
        sendEmail(tutor.email, 'New Session Scheduled', emailMsg);

        res.json({ success: true, session });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Tutor Stats
app.get('/api/tutor-stats', verifyToken, async (req, res) => {
    const sessionsCompleted = await Session.countDocuments({ tutorId: req.user._id, status: 'completed' });
    const hoursTaught = sessionsCompleted * 1; // Assuming 1 hour per session
    res.json({ rating: '5.0', sessionsCompleted, hoursTaught });
});

// Get Tutor Sessions
app.get('/api/tutor/sessions', verifyToken, async (req, res) => {
    const sessions = await Session.find({ tutorId: req.user._id }).sort({ scheduledTime: 1 });
    res.json(sessions);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));