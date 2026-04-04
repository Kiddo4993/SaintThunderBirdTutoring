import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';

async function sendEmailSafe({ to, subject, html }) {
    try { await sendEmail({ to, subject, html }); } catch (e) { console.error('❌ Email error:', e.message); }
}

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { sessionId, hoursSpent } = await request.json();
        const tutor = await User.findById(authUser.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return NextResponse.json({ error: 'Only tutors can complete sessions' }, { status: 403 });
        }

        let completedSession = null;
        let student = null;
        const parsedHours = Number(hoursSpent);

        if (tutor.tutorSessions) {
            tutor.tutorSessions.forEach((session) => {
                if (session._id.toString() === sessionId) {
                    session.status = 'completed';
                    session.hoursSpent = Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : Number(session.plannedHours || 1);
                    session.completedAt = new Date();
                    completedSession = session;
                }
            });
            await tutor.save();

            if (completedSession) {
                student = await User.findById(completedSession.studentId);
                if (student?.studentSessions) {
                    student.studentSessions.forEach((session) => {
                        const exactMatch = session.tutorSessionId && session.tutorSessionId.toString() === completedSession._id.toString();
                        const fallbackMatch = !session.tutorSessionId && session.tutorId?.toString() === tutor._id.toString()
                            && session.subject === completedSession.subject && session.status === 'scheduled';
                        if (exactMatch || fallbackMatch) {
                            session.status = 'completed';
                            session.hoursSpent = completedSession.hoursSpent;
                            session.completedAt = new Date();
                        }
                    });
                    await student.save();
                }
            }
        }

        if (completedSession && student) {
            const tutorHours = (tutor.tutorSessions?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0) || 0).toFixed(1);
            const tutorCount = tutor.tutorSessions?.filter((s) => s.status === 'completed').length || 0;
            const studentHours = (student.studentSessions?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0) || 0).toFixed(1);
            const studentCount = student.studentSessions?.filter((s) => s.status === 'completed').length || 0;

            sendEmailSafe({
                to: ADMIN_EMAIL,
                subject: `📊 Session Completed - ${tutor.firstName} & ${student.firstName}`,
                html: `<h2>Session Completed</h2>
                    <p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName} (${tutor.email}) — ${tutorCount} sessions, ${tutorHours} hrs total</p>
                    <p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.email}) — ${studentCount} sessions, ${studentHours} hrs total</p>
                    <p><strong>Subject:</strong> ${completedSession.subject}</p>
                    <p><strong>Hours this session:</strong> ${completedSession.hoursSpent}</p>
                    <p><strong>Completed:</strong> ${new Date().toLocaleString()}</p>`
            });
        }

        return NextResponse.json({ success: true, message: 'Session completed and admin notified' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
