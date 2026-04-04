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
        if (!tutor || tutor.userType !== 'tutor') {
            return NextResponse.json({ error: 'Only tutors can view their sessions' }, { status: 403 });
        }

        const sessions = [];
        if (tutor.tutorSessions) {
            for (const session of tutor.tutorSessions) {
                const student = await User.findById(session.studentId);
                if (student) {
                    sessions.push({
                        _id: session._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentEmail: student.email,
                        subject: session.subject || 'Mathematics',
                        scheduledTime: session.scheduledTime,
                        status: session.status,
                        zoomLink: session.zoomLink,
                        zoomMeetingId: session.zoomMeetingId,
                        hoursSpent: session.hoursSpent,
                        completedAt: session.completedAt
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            sessions: sessions.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime))
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
