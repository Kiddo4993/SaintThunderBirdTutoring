import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';

function toDurationLabel(value) {
    const map = { '30min': '30 minutes', '1hour': '1 hour', '1.5hours': '1.5 hours', '2hours': '2 hours' };
    return map[value] || value || 'Not specified';
}

async function sendEmailSafe({ to, subject, html }) {
    try { await sendEmail({ to, subject, html }); } catch (e) { console.error('❌ Email error:', e.message); }
}

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { subject, description, priority, requestedTime, selectedTutorId } = await request.json();

        if (!subject) return NextResponse.json({ success: false, error: 'Subject is required' }, { status: 400 });
        if (!requestedTime) return NextResponse.json({ success: false, error: 'Session duration is required' }, { status: 400 });

        const student = await User.findById(authUser.userId);
        if (!student) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
        if (student.userType !== 'student') return NextResponse.json({ success: false, error: 'Only students can create requests' }, { status: 403 });

        if (selectedTutorId) {
            const selectedTutor = await User.findOne({ _id: selectedTutorId, userType: 'tutor', 'tutorApplication.status': 'approved' });
            if (!selectedTutor) return NextResponse.json({ success: false, error: 'Selected tutor is unavailable' }, { status: 400 });
        }

        if (!student.tutorRequests) student.tutorRequests = [];

        const newRequest = {
            subject,
            description: description || '',
            priority: priority || 'medium',
            requestedTime,
            requestedTutorId: selectedTutorId || undefined,
            createdAt: new Date(),
            status: 'pending'
        };

        student.tutorRequests.push(newRequest);
        await student.save();

        // Notify admin
        sendEmailSafe({
            to: ADMIN_EMAIL,
            subject: `📝 New Tutoring Request - ${student.firstName} ${student.lastName}`,
            html: `<h2>New Tutoring Request</h2><p><strong>Student:</strong> ${student.firstName} ${student.lastName} (${student.email})</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Duration:</strong> ${toDurationLabel(requestedTime)}</p><p><strong>Description:</strong> ${description || 'None'}</p>`
        });

        // Notify matching tutors
        let selectedTutor = null;
        if (selectedTutorId) {
            selectedTutor = await User.findOne({ _id: selectedTutorId, userType: 'tutor', 'tutorApplication.status': 'approved' });
        }

        let targetEmails = [];
        if (selectedTutor) {
            targetEmails = [selectedTutor.email];
        } else {
            const allTutors = await User.find({ userType: 'tutor', 'tutorApplication.status': 'approved' });
            targetEmails = allTutors.filter((tutor) => {
                const tutorSubjects = tutor.tutorProfile?.subjects?.length > 0 ? tutor.tutorProfile.subjects : (tutor.tutorApplication?.subjects || []);
                const hasGeneral = tutorSubjects.some((s) => s === 'General' || s === 'General Help');
                return hasGeneral || tutorSubjects.includes(subject) || tutorSubjects.length === 0;
            }).map((t) => t.email);
        }

        if (targetEmails.length > 0) {
            sendEmailSafe({
                to: targetEmails.join(','),
                subject: `📢 ${selectedTutor ? 'New Tutoring Request for You!' : 'Open Tutoring Request Available'} - ${subject}`,
                html: `<h2>New Tutoring Request</h2><p><strong>${student.firstName} ${student.lastName}</strong> needs help with <strong>${subject}</strong>.</p><p><strong>Duration:</strong> ${toDurationLabel(requestedTime)}</p><p><strong>Description:</strong> ${description || 'None'}</p><p>Log in to your tutor dashboard to accept the request.</p>`
            });
        }

        return NextResponse.json({ success: true, message: 'Request created successfully', request: newRequest });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
