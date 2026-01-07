const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

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

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userType } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password || !userType) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            userType
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET USER PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/all-users', authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.userId);
        
        // Check if user is admin
        if (adminUser.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Only admin can view all users' });
        }

        // Get all users with their data
        const users = await User.find().select('-password');

        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;

// Update the SIGNUP endpoint in your routes/auth.js with this:

router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userType, tutorProfile } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password || !userType) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            userType,
            // Save tutor profile if signing up as tutor
            ...(userType === 'tutor' && tutorProfile && {
                tutorProfile: {
                    subjects: tutorProfile.subjects || [],
                    experience: tutorProfile.experience || '',
                    availability: tutorProfile.availability || '',
                    motivation: tutorProfile.motivation || ''
                },
                tutorApplication: {
                    status: 'pending',
                    appliedAt: new Date()
                }
            })
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send email to admin about new tutor application
        if (userType === 'tutor') {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: 'dylanduancanada@gmail.com',
                subject: `📋 New Tutor Application: ${firstName} ${lastName}`,
                html: `
                    <h2>New Tutor Application Received!</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subjects:</strong> ${tutorProfile?.subjects?.join(', ') || 'N/A'}</p>
                    <p><strong>Experience:</strong> ${tutorProfile?.experience || 'N/A'}</p>
                    <p><strong>Availability:</strong> ${tutorProfile?.availability || 'N/A'}</p>
                    <p><strong>Motivation:</strong> ${tutorProfile?.motivation || 'N/A'}</p>
                    <hr>
                    <p>Review this application in your admin dashboard.</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log('Email error:', error);
            });
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType,
                tutorProfile: user.tutorProfile
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update these endpoints in your routes/auth.js

// APPROVE TUTOR (Admin only - checks email)
router.post('/approve-tutor/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is admin (dylanduancanada@gmail.com)
        const adminUser = await User.findById(req.user.userId);
        
        if (!adminUser || adminUser.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Only admin can approve tutors' });
        }

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
            subject: '🎉 Your Tutor Application Has Been Approved!',
            html: `
                <h2>Congratulations ${user.firstName}!</h2>
                <p>Your tutor application for <strong>Saint Thunderbird Tutoring</strong> has been <strong>APPROVED!</strong></p>
                
                <h3>🚀 You can now:</h3>
                <ul>
                    <li>Access your tutor dashboard</li>
                    <li>View student requests for help</li>
                    <li>Conduct tutoring sessions on Zoom</li>
                    <li>Track your volunteer hours</li>
                    <li>Earn recognition for your contributions</li>
                </ul>

                <p><strong>Your Subjects:</strong> ${user.tutorProfile?.subjects?.join(', ') || 'N/A'}</p>

                <h3>📚 How It Works:</h3>
                <ol>
                    <li>Login to access your tutor dashboard</li>
                    <li>See student requests that match your subjects</li>
                    <li>Accept requests to create tutoring sessions</li>
                    <li>Receive Zoom meeting links via email</li>
                    <li>Conduct sessions and log your hours</li>
                </ol>

                <p><strong>Questions?</strong> Email dylanduancanada@gmail.com</p>

                <p>Welcome to the Saint Thunderbird team! 🌩️⚡</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('Email error:', error);
        });

        res.json({
            success: true,
            message: 'Tutor approved successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DENY TUTOR APPLICATION (Admin only - checks email)
router.post('/deny-tutor/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        // Check if user is admin
        const adminUser = await User.findById(req.user.userId);
        
        if (!adminUser || adminUser.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Only admin can deny applications' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                'tutorApplication.status': 'denied',
                'tutorApplication.deniedAt': new Date(),
                'tutorApplication.denialReason': reason || ''
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send denial email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Saint Thunderbird Tutor Application',
            html: `
                <h2>Application Status Update</h2>
                <p>Thank you for your interest in tutoring at Saint Thunderbird.</p>
                <p>Unfortunately, your application was not approved at this time.</p>
                
                ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}

                <p>You are welcome to apply again in the future. If you have questions, please contact dylanduancanada@gmail.com</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('Email error:', error);
        });

        res.json({
            success: true,
            message: 'Application denied'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ALL PENDING APPLICATIONS (Admin only - checks email)
router.get('/pending-applications', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        const adminUser = await User.findById(req.user.userId);
        
        if (!adminUser || adminUser.email !== 'dylanduancanada@gmail.com') {
            return res.status(403).json({ error: 'Only admin can view applications' });
        }

        const pending = await User.find({
            'tutorApplication.status': 'pending'
        }).select('firstName lastName email tutorProfile tutorApplication');

        res.json({
            success: true,
            applications: pending
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});