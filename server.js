require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path'); // ADDED: Required for file paths

// Import Models
const User = require('./models/User');
const Request = require('./models/Request');
const Session = require('./models/Session');

const app = express();
app.use(express.json());
app.use(cors());

// --- NEW: SERVE STATIC FILES ---
// This tells Express to serve your HTML, CSS, and JS files from the root folder
app.use(express.static(path.join(__dirname, './')));

// --- 1. EMAIL CONFIGURATION (Gmail) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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

// --- NEW: FRONTEND ROUTES ---
// This fixes the "Cannot GET /" error
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// This helps find other pages like /login or /about without needing .html in the URL
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    // Skip if this is an API call or a file with an extension
    if (page.startsWith('api') || page.includes('.')) return next();
    res.sendFile(path.join(__dirname, `${page}.html`), (err) => {
        if (err) next();
    });
});

// --- 4. AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userType } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const status = userType === 'tutor' ? 'pending' : 'active';
        const user = new User({ firstName, lastName, email, password: hashedPassword, userType, status });
        await user.save();
        if (userType === 'tutor') {
            sendEmail(email, 'Application Received', 'Your application to Saint Thunderbird is pending approval.');
            sendEmail('dylanduancanada@gmail.com', 'New Tutor Application', `${firstName} has applied to be a tutor.`);
        }
        const token = jwt.sign({ _id: user._id, userType: user.userType }, process.env.JWT_SECRET || 'secret');
        res.json({ success: true, token, user });
    } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });
        if (user.status === 'pending') return res.status(403).json({ error: 'Account pending approval' });
        const token = jwt.sign({ _id: user._id, userType: user.userType }, process.env.JWT_SECRET || 'secret');
        res.json({ success: true, token, user });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
    sendEmail(user.email, 'Application Approved! 🎉', 'You are now an active tutor at Saint Thunderbird.');
    res.json({ success: true });
});

// --- 6. STUDENT & TUTOR ROUTES ---
app.post('/api/tutor/create-request', verifyToken, async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        const newRequest = new Request({
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            subject: req.body.subject,
            description: req.body.description
        });
        await newRequest.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tutor/requests', verifyToken, async (req, res) => {
    const requests = await Request.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests);
});

app.post('/api/tutor/accept-request', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.body;
        const tutor = await User.findById(req.user._id);
        const request = await Request.findById(requestId);
        const student = await User.findById(request.studentId);
        request.status = 'accepted';
        await request.save();
        const zoomLink = `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        const session = new Session({
            tutorId: tutor._id, tutorName: tutor.firstName, studentId: student._id,
            studentName: student.firstName, studentEmail: student.email,
            subject: request.subject, zoomLink: zoomLink, scheduledTime: new Date()
        });
        await session.save();
        sendEmail(student.email, 'Tutoring Confirmed', `Link: ${zoomLink}`);
        res.json({ success: true, session });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tutor/sessions', verifyToken, async (req, res) => {
    const sessions = await Session.find({ tutorId: req.user._id }).sort({ scheduledTime: 1 });
    res.json(sessions);
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
// Note: '0.0.0.0' is important for Render to bind to the port correctly
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));