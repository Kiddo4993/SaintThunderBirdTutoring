import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL } from '@/lib/services/emailService';

export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const user = await User.findById(authUser.userId);
        if (!user || user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
        }
        const [pendingCount, approvedCount, totalApplications] = await Promise.all([
            User.countDocuments({ 'tutorApplication.status': 'pending' }),
            User.countDocuments({ 'tutorApplication.status': 'approved', userType: 'tutor' }),
            User.countDocuments({ tutorApplication: { $exists: true } })
        ]);
        return NextResponse.json({ success: true, pendingCount, approvedCount, totalApplications });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
