import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { name, age } = await request.json();
        if (!name || !age) return NextResponse.json({ error: 'Name and age required' }, { status: 400 });

        const user = await User.findByIdAndUpdate(
            authUser.userId,
            { tutorApplication: { name, age, status: 'pending', appliedAt: new Date() } },
            { new: true }
        );

        sendEmail({
            to: ADMIN_EMAIL,
            subject: `New Tutor Application: ${name}`,
            html: `<h2>New Tutor Application</h2><p><strong>Name:</strong> ${name}</p><p><strong>Age:</strong> ${age}</p><p><strong>Email:</strong> ${user.email}</p><p><strong>Applied:</strong> ${new Date().toLocaleString()}</p>`
        }).catch((e) => console.error('❌ Application email error:', e.message));

        return NextResponse.json({ success: true, message: 'Application submitted!', application: user.tutorApplication });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
