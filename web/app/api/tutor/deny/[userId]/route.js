import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/services/emailService';

// Legacy GET route used in old denial email links
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { userId } = await params;
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await User.findByIdAndUpdate(userId, { $unset: { tutorApplication: 1 } });

        sendEmail({
            to: user.email,
            subject: 'Your Tutor Application Status',
            html: `<h2>Tutor Application Update</h2><p>Unfortunately, your application has been <strong>DENIED</strong>. You can apply again in the future.</p>`
        }).catch((e) => console.error('❌ Denial email error:', e.message));

        return NextResponse.json({ success: true, message: 'Application denied!' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
