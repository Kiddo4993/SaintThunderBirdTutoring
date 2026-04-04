import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';
import { subscribeUser } from '@/lib/services/mailchimpService';

function buildTutorProfile(rawProfile = {}) {
    return {
        subjects: Array.isArray(rawProfile.subjects) ? rawProfile.subjects : [],
        bio: rawProfile.bio || '',
        educationLevel: rawProfile.educationLevel || '',
        availability: rawProfile.availability || '',
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
            ? { educationLevel: user.tutorProfile.educationLevel || '', availableTimes: user.tutorProfile.availableTimes || [], subjects: user.tutorProfile.subjects || [] }
            : undefined
    };
}

async function sendSignupEmails(user) {
    const fullName = `${user.firstName} ${user.lastName}`;

    if (!user.tutorApplication) {
        await Promise.allSettled([
            sendEmail({
                to: ADMIN_EMAIL,
                subject: `New Student Signup: ${fullName}`,
                html: `<h2>New Student Signup</h2><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${user.email}</p><p><strong>Signed Up:</strong> ${new Date().toLocaleString()}</p>`
            }),
            sendEmail({
                to: user.email,
                subject: 'Welcome to Saint Thunderbird Tutoring',
                html: `<h2>Welcome to Saint Thunderbird Tutoring</h2><p>Hi ${user.firstName},</p><p>Your student account is now active. You can log in and request tutoring help anytime.</p>`
            })
        ]);
        return;
    }

    await Promise.allSettled([
        sendEmail({
            to: ADMIN_EMAIL,
            subject: `New Tutor Application: ${fullName}`,
            html: `<h2>New Tutor Application</h2><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${user.email}</p><p><strong>Education Level:</strong> ${user.tutorApplication.educationLevel || 'Not provided'}</p><p><strong>Subjects:</strong> ${(user.tutorApplication.subjects || []).join(', ') || 'Not provided'}</p><p><strong>Experience:</strong> ${user.tutorApplication.experience || 'Not provided'}</p><p><strong>Motivation:</strong> ${user.tutorApplication.motivation || 'Not provided'}</p>`
        }),
        sendEmail({
            to: user.email,
            subject: 'Tutor Application Received - Saint Thunderbird Tutoring',
            html: `<h2>Tutor Application Received</h2><p>Hi ${user.firstName},</p><p>Your tutor application is now pending review. We will email you when a decision is made.</p>`
        })
    ]);
}

export async function POST(request) {
    try {
        await connectDB();
        const { firstName, lastName, email, password, userType, tutorProfile: tutorProfileInput } = await request.json();

        if (!firstName || !lastName || !email || !password || !userType) {
            return NextResponse.json({ error: 'All fields required' }, { status: 400 });
        }
        if (!['student', 'tutor'].includes(userType)) {
            return NextResponse.json({ error: 'Invalid userType' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const actualUserType = userType;
        const rawProfile = tutorProfileInput || {};

        const userData = {
            firstName, lastName, email,
            password: hashedPassword,
            userType: actualUserType,
            tutorApplication: userType === 'tutor'
                ? {
                    status: 'pending',
                    appliedAt: new Date(),
                    name: `${firstName} ${lastName}`,
                    requestedType: 'tutor',
                    subjects: Array.isArray(rawProfile.subjects) ? rawProfile.subjects : [],
                    educationLevel: rawProfile.educationLevel || '',
                    experience: rawProfile.experience || '',
                    motivation: rawProfile.motivation || ''
                }
                : undefined
        };

        if (userType === 'tutor') {
            userData.tutorProfile = buildTutorProfile(rawProfile);
        }

        const user = new User(userData);
        await user.save();

        sendSignupEmails(user).catch((e) => console.error('❌ Signup email failed:', e.message));
        subscribeUser({ email: user.email, firstName: user.firstName, lastName: user.lastName, userType: user.userType })
            .catch((e) => console.error('❌ Mailchimp sync failed:', e.message));

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({ success: true, token, user: createAuthUserPayload(user) }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
