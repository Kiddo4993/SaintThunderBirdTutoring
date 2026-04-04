import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const tutor = await User.findById(authUser.userId);
        const completedSessions = tutor.tutorSessions?.filter((s) => s.status === 'completed').length || 0;
        const hoursTaught = (tutor.tutorSessions?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0) || 0).toFixed(1);
        return NextResponse.json({ success: true, rating: 4.9, sessionsCompleted: completedSessions, hoursTaught });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
