import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { sessionId } = await request.json();
        const tutor = await User.findById(authUser.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return NextResponse.json({ error: 'Only tutors can start sessions' }, { status: 403 });
        }

        const session = tutor.tutorSessions?.find((s) => s._id.toString() === sessionId);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        if (session.status === 'completed') {
            return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
        }

        session.status = 'in-progress';
        session.startedAt = new Date();
        await tutor.save();

        return NextResponse.json({ success: true, startedAt: session.startedAt });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
