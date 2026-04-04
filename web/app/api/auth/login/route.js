import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

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

export async function POST(request) {
    try {
        await connectDB();
        const { email, password } = await request.json();
        const user = await User.findOne({ email });

        if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        const isRawMatch = user.password === password;

        if (!isMatch && !isRawMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({ success: true, token, user: createAuthUserPayload(user) });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
