import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const student = await User.findById(authUser.userId);
        if (!student || student.userType !== 'student') {
            return NextResponse.json({ error: 'Only students can view their stats' }, { status: 403 });
        }
        const requestsMade = student.tutorRequests?.length || 0;
        const completedSessions = student.studentSessions?.filter((s) => s.status === 'completed').length || 0;
        const hoursLearned = (student.studentSessions?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0) || 0).toFixed(1);
        return NextResponse.json({ success: true, requestsMade, completedSessions, hoursLearned });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
