const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ADMIN_EMAIL, sendEmail } = require('../services/emailService');

const router = express.Router();

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

function buildTutorProfile(rawProfile = {}) {
    return {
        subjects: Array.isArray(rawProfile.subjects) ? rawProfile.subjects : [],
        bio: rawProfile.bio || '',
        educationLevel: rawProfile.educationLevel || '',
        availability: rawProfile.availability || '', // legacy
        motivation: rawProfile.motivation || '',
        availableTimes: Array.isArray(rawProfile.availableTimes) ? rawProfile.availableTimes : [],
        experience: rawProfile.experience || ''
    };
}

function createAuthUserPayload(user) {
    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        tutorApplication: user.tutorApplication
            ? { status: user.tutorApplication.status, appliedAt: user.tutorApplication.appliedAt }
            : undefined,
        tutorProfile: user.tutorProfile
            ? {
                educationLevel: user.tutorProfile.educationLevel || '',
                availableTimes: user.tutorProfile.availableTimes || [],
                subjects: user.tutorProfile.subjects || []
            }
            : undefined
    };
}

async function sendSignupEmails(user) {
    const fullName = `${user.firstName} ${user.lastName}`;

    if (!user.tutorApplication) {
        const adminHtml = `
            <h2>New Student Signup</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Signed Up:</strong> ${new Date().toLocaleString()}</p>
        `;

        const studentHtml = `
            <h2>Welcome to Saint Thunderbird Tutoring</h2>
            <p>Hi ${user.firstName},</p>
            <p>Your student account is now active. You can log in and request tutoring help anytime.</p>
            <p>Thank you for joining us.</p>
        `;

        await Promise.allSettled([
            sendEmail({
                to: ADMIN_EMAIL,
                subject: `New Student Signup: ${fullName}`,
                html: adminHtml
            }),
            sendEmail({
                to: user.email,
                subject: 'Welcome to Saint Thunderbird Tutoring',
                html: studentHtml
            })
        ]);

        return;
    }

    if (user.tutorApplication) {
        const tutorProfile = user.tutorProfile || {};
        const adminHtml = `
            <h2>New Tutor Application</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Education Level:</strong> ${user.tutorApplication.educationLevel || 'Not provided'}</p>
            <p><strong>Subjects:</strong> ${(user.tutorApplication.subjects || []).join(', ') || 'Not provided'}</p>
            <p><strong>Experience:</strong> ${user.tutorApplication.experience || 'Not provided'}</p>
            <p><strong>Motivation:</strong> ${user.tutorApplication.motivation || 'Not provided'}</p>
            <p><strong>Applied At:</strong> ${new Date().toLocaleString()}</p>
        `;

        const tutorHtml = `
            <h2>Tutor Application Received</h2>
            <p>Hi ${user.firstName},</p>
            <p>Your tutor application is now pending review. We will email you when a decision is made.</p>
            <p>Thank you for applying to support our students.</p>
        `;

        await Promise.allSettled([
            sendEmail({
                to: ADMIN_EMAIL,
                subject: `New Tutor Application: ${fullName}`,
                html: adminHtml
            }),
            sendEmail({
                to: user.email,
                subject: 'Tutor Application Received - Saint Thunderbird Tutoring',
                html: tutorHtml
            })
        ]);
    }
}

router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, userType } = req.body;

        if (!firstName || !lastName || !email || !password || !userType) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (!['student', 'tutor'].includes(userType)) {
            return res.status(400).json({ error: 'Invalid userType' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // SECURITY FIX: Tutor applicants stay as 'student' until approved by admin
        // Only students get immediate 'student' userType
        // Tutors get 'student' userType + tutorApplication with 'pending' status
        const actualUserType = userType === 'tutor' ? 'student' : userType;
        const tutorProfileInput = req.body.tutorProfile || {};

        const userData = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            userType: actualUserType,
            tutorApplication: userType === 'tutor'
                ? {
                    status: 'pending',
                    appliedAt: new Date(),
                    name: `${firstName} ${lastName}`,
                    requestedType: 'tutor',
                    subjects: Array.isArray(tutorProfileInput.subjects) ? tutorProfileInput.subjects : [],
                    educationLevel: tutorProfileInput.educationLevel || '',
                    experience: tutorProfileInput.experience || '',
                    motivation: tutorProfileInput.motivation || ''
                }
                : undefined
        };

        if (userType === 'tutor') {
            userData.tutorProfile = buildTutorProfile(tutorProfileInput);
        }

        const user = new User(userData);
        await user.save();

        sendSignupEmails(user).catch((error) => {
            console.error('❌ Signup email flow failed:', error.message);
        });

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return the user payload so frontend knows to redirect to pending page if necessary
        res.status(201).json({
            success: true,
            token,
            user: createAuthUserPayload(user)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        const isRawMatch = user.password === password;

        if (!isMatch && !isRawMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: createAuthUserPayload(user)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
