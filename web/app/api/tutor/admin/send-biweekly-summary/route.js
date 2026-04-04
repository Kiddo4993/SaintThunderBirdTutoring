import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL } from '@/lib/services/emailService';
import { sendBiweeklyTutorSummary } from '@/lib/jobs/biweeklyTutorSummary';

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const admin = await User.findById(authUser.userId);
        if (!admin || admin.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const result = await sendBiweeklyTutorSummary({ force: true });
        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
