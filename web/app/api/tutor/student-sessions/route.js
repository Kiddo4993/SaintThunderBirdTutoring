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
            return NextResponse.json({ error: 'Only students can view their sessions' }, { status: 403 });
        }

        const sessions = [];

        if (student.studentSessions?.length > 0) {
            for (const session of student.studentSessions) {
                const tutor = await User.findById(session.tutorId);
                if (tutor) {
                    sessions.push({
                        _id: session._id,
                        tutorName: session.tutorName || `${tutor.firstName} ${tutor.lastName}`,
                        tutorEmail: tutor.email,
                        subject: session.subject || 'Mathematics',
                        scheduledTime: session.scheduledTime,
                        status: session.status,
                        zoomLink: session.zoomLink,
                        zoomMeetingId: session.zoomMeetingId,
                        zoomPassword: session.zoomPassword
                    });
                }
            }
        }

        // Backward-compat: also scan tutor sessions
        const tutors = await User.find({ userType: 'tutor' });
        for (const tutor of tutors) {
            if (tutor.tutorSessions) {
                tutor.tutorSessions.forEach((session) => {
                    if (session.studentId.toString() === student._id.toString()) {
                        const exists = sessions.find((s) => s._id && s._id.toString() === session._id.toString());
                        if (!exists) {
                            sessions.push({
                                _id: session._id,
                                tutorName: `${tutor.firstName} ${tutor.lastName}`,
                                tutorEmail: tutor.email,
                                subject: session.subject || 'Mathematics',
                                scheduledTime: session.scheduledTime,
                                status: session.status,
                                zoomLink: session.zoomLink,
                                zoomMeetingId: session.zoomMeetingId,
                                zoomPassword: session.zoomPassword
                            });
                        }
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            sessions: sessions
                .filter((s) => new Date(s.scheduledTime) > new Date())
                .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
