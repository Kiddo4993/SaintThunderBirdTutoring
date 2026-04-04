import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';

async function sendEmailSafe({ to, subject, html }) {
    try { await sendEmail({ to, subject, html }); } catch (e) { console.error('❌ Email error:', e.message); }
}

export async function POST(request, { params }) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const admin = await User.findById(authUser.userId);
        if (!admin || admin.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = await params;
        const { reason } = await request.json().catch(() => ({}));

        const targetUser = await User.findById(userId);
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await User.findByIdAndUpdate(userId, {
            'tutorApplication.status': 'denied',
            'tutorApplication.deniedAt': new Date(),
            'tutorApplication.denialReason': reason || 'No reason provided'
        });

        sendEmailSafe({
            to: targetUser.email,
            subject: 'Your Tutor Application Status',
            html: `<h2>Tutor Application Update</h2><p>Thank you for applying to become a tutor on Saint Thunderbird.</p><p>Unfortunately, your application has been <strong>DENIED</strong> at this time.</p><p>You can apply again in the future.</p>`
        });

        return NextResponse.json({ success: true, message: 'Application denied and email sent' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
