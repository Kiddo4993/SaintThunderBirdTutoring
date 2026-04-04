import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';
import { createSessionMeeting } from '@/lib/services/zoomService';

function toDurationLabel(value) {
    const map = { '30min': '30 minutes', '1hour': '1 hour', '1.5hours': '1.5 hours', '2hours': '2 hours' };
    return map[value] || value || 'Not specified';
}
function durationToHours(value) {
    const map = { '30min': 0.5, '1hour': 1, '1.5hours': 1.5, '2hours': 2 };
    return map[value] || 1;
}
function durationToMinutes(value) {
    return Math.round(durationToHours(value) * 60);
}
async function sendEmailSafe({ to, subject, html }) {
    try { await sendEmail({ to, subject, html }); } catch (e) { console.error('❌ Email error:', e.message); }
}

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { requestId } = await request.json();
        const tutor = await User.findById(authUser.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return NextResponse.json({ error: 'Only tutors can accept requests' }, { status: 403 });
        }
        if (!tutor.tutorSessions) tutor.tutorSessions = [];

        // Find student/request by subdocument id
        let student = await User.findOne({ 'tutorRequests._id': requestId });
        let matchingRequest = null;
        let requestIndex = -1;
        let studentId = null;

        if (student) {
            requestIndex = (student.tutorRequests || []).findIndex(
                (req) => req._id?.toString() === requestId && req.status === 'pending'
            );
            if (requestIndex >= 0) {
                matchingRequest = student.tutorRequests[requestIndex];
                studentId = student._id;
            }
        }

        // Legacy fallback: "studentId-index-*"
        if (!matchingRequest) {
            const parts = String(requestId || '').split('-');
            studentId = parts[0];
            requestIndex = parseInt(parts[1], 10);
            if (studentId) student = await User.findById(studentId);
            if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            if (Array.isArray(student.tutorRequests) && Number.isInteger(requestIndex) && requestIndex >= 0 && requestIndex < student.tutorRequests.length) {
                const req = student.tutorRequests[requestIndex];
                if (req && req.status === 'pending') matchingRequest = req;
            }
        }

        if (!student || !matchingRequest) {
            return NextResponse.json({ error: 'Request not found or already accepted' }, { status: 404 });
        }

        const requestSubject = matchingRequest.subject || 'Mathematics';
        const requestedTime = matchingRequest.requestedTime || '1hour';
        const plannedHours = durationToHours(requestedTime);
        const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const meeting = await createSessionMeeting({
            topic: `Saint Thunderbird - ${requestSubject} with ${student.firstName}`,
            durationMinutes: durationToMinutes(requestedTime),
            startTime: scheduledTime
        });
        const sessionRefId = meeting.id;
        const zoomPassword = meeting.password || '';
        const zoomLink = meeting.joinUrl;

        const session = {
            studentId,
            subject: requestSubject,
            scheduledTime,
            status: 'scheduled',
            createdAt: new Date(),
            zoomMeetingId: sessionRefId,
            zoomPassword,
            zoomLink,
            plannedHours
        };

        tutor.tutorSessions.push(session);
        await tutor.save();
        const createdTutorSession = tutor.tutorSessions[tutor.tutorSessions.length - 1];

        matchingRequest.status = 'accepted';
        matchingRequest.acceptedAt = new Date();
        matchingRequest.tutorId = tutor._id;
        await student.save();

        if (!student.studentSessions) student.studentSessions = [];
        student.studentSessions.push({
            tutorId: tutor._id,
            tutorName: `${tutor.firstName} ${tutor.lastName}`,
            subject: requestSubject,
            scheduledTime,
            status: 'scheduled',
            zoomLink,
            zoomMeetingId: sessionRefId,
            zoomPassword,
            tutorSessionId: createdTutorSession?._id,
            plannedHours,
            createdAt: new Date()
        });
        await student.save();

        const zoomSection = zoomLink
            ? `<p><strong>Join Link:</strong> <a href="${zoomLink}">${zoomLink}</a></p><p><strong>Meeting ID:</strong> ${sessionRefId}</p>`
            : `<p>Please create a Zoom or Google Meet link and share it with the student: <a href="mailto:${student.email}">${student.email}</a></p>`;

        sendEmailSafe({
            to: tutor.email,
            subject: '🎓 New Student Session - Action Required',
            html: `<h2>You Have a New Tutoring Session!</h2><p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.email})</p><p><strong>Subject:</strong> ${requestSubject}</p><p><strong>Duration:</strong> ${toDurationLabel(requestedTime)}</p>${zoomSection}`
        });

        sendEmailSafe({
            to: student.email,
            subject: `✅ Tutor ${tutor.firstName} Accepted Your Request!`,
            html: `<h2>Great News!</h2><p><strong>${tutor.firstName} ${tutor.lastName}</strong> accepted your tutoring request!</p><p><strong>Subject:</strong> ${requestSubject}</p><p><strong>Tutor Email:</strong> <a href="mailto:${tutor.email}">${tutor.email}</a></p>${zoomLink ? `<p><strong>Zoom Link:</strong> <a href="${zoomLink}">${zoomLink}</a></p>` : '<p>Your tutor will email you a meeting link.</p>'}`
        });

        sendEmailSafe({
            to: ADMIN_EMAIL,
            subject: `🔔 New Session - ${tutor.firstName} ${tutor.lastName} & ${student.firstName} ${student.lastName}`,
            html: `<h2>New Tutoring Session Created</h2><p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName} (${tutor.email})</p><p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.email})</p><p><strong>Subject:</strong> ${requestSubject}</p><p><strong>Reference:</strong> #${sessionRefId}</p>`
        });

        return NextResponse.json({ success: true, message: 'Request accepted!', sessionRefId, tutorEmail: tutor.email, zoomLink });
    } catch (error) {
        console.error('Error in accept-request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
