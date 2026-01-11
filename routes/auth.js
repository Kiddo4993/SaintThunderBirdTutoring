const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Make sure you have this: npm install bcryptjs
const User = require('../models/User');
const router = express.Router();

// Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
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

        if (!firstName || !lastName || !email || !password || !userType) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword, // hashing password for security
            userType,
            // If tutor, status is pending. If student, status is active.
            tutorApplication: userType === 'tutor' ? { status: 'pending', appliedAt: new Date() } : undefined
        });

        await user.save();

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, firstName, lastName, email, userType }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Check password (supports both hashed and raw passwords for now)
        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        const isRawMatch = user.password === password; // For older accounts created without hash

        if (!isMatch && !isRawMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

// GET CURRENT USER PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;