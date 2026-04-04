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
        const targetUser = await User.findById(userId);
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const existingProfile = targetUser.tutorProfile || {};
        const updatedProfile = {
            subjects: existingProfile.subjects || ['General'],
            bio: existingProfile.bio || 'I am ready to help!',
            availability: existingProfile.availability || '',
            motivation: existingProfile.motivation || '',
            experience: existingProfile.experience || '',
            availableTimes: existingProfile.availableTimes || [],
            educationLevel: existingProfile.educationLevel || ''
        };

        await User.findByIdAndUpdate(userId, {
            userType: 'tutor',
            'tutorApplication.status': 'approved',
            'tutorApplication.approvedAt': new Date(),
            tutorProfile: updatedProfile
        }, { new: true });

        sendEmailSafe({
            to: targetUser.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `<h2>Congratulations ${targetUser.firstName}!</h2><p>Your tutor application has been <strong>APPROVED</strong>.</p><p>You can now log in and start tutoring.</p>`
        });

        return NextResponse.json({ success: true, message: 'Tutor approved and email sent!' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
