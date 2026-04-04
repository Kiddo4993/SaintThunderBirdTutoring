import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/services/emailService';

// Legacy GET route used in old approval email links
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { userId } = await params;
        const user = await User.findByIdAndUpdate(
            userId,
            { userType: 'tutor', 'tutorApplication.status': 'approved', 'tutorApplication.approvedAt': new Date() },
            { new: true }
        );
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        sendEmail({
            to: user.email,
            subject: 'Your Tutor Application Has Been Approved! 🎉',
            html: `<h2>Congratulations ${user.firstName}!</h2><p>Your tutor application has been <strong>APPROVED</strong>! You can now start tutoring.</p>`
        }).catch((e) => console.error('❌ Approval email error:', e.message));

        return NextResponse.json({ success: true, message: 'Tutor approved!' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
