import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';
import { ADMIN_EMAIL, sendEmail } from '@/lib/services/emailService';

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const tutor = await User.findById(authUser.userId);

        if (!tutor || tutor.userType !== 'tutor') {
            return NextResponse.json({ error: 'Only tutors can submit volunteer hours' }, { status: 403 });
        }

        const currentHours = (tutor.tutorSessions || [])
            .filter((s) => s.status === 'completed')
            .reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0);

        const currentSessions = (tutor.tutorSessions || []).filter((s) => s.status === 'completed').length;

        const previousHours = tutor.lastVolunteerSubmission?.hours ?? 0;
        const previousDate = tutor.lastVolunteerSubmission?.submittedAt;
        const newHours = Math.max(0, currentHours - previousHours);

        const previousLabel = previousDate
            ? `${previousHours} hrs (submitted ${new Date(previousDate).toLocaleDateString()})`
            : `0 hrs (no previous submission)`;

        await sendEmail({
            to: ADMIN_EMAIL,
            subject: `📋 Volunteer Hours Submission — ${tutor.firstName} ${tutor.lastName}`,
            html: `
                <h2>Volunteer Hours Submission</h2>
                <p><strong>Tutor:</strong> ${tutor.firstName} ${tutor.lastName} (${tutor.email})</p>
                <hr />
                <p><strong>Previous submission:</strong> ${previousLabel}</p>
                <p><strong>Current total:</strong> ${currentHours.toFixed(1)} hrs across ${currentSessions} sessions</p>
                <p><strong>New hours since last submission:</strong> ${newHours.toFixed(1)} hrs</p>
                <hr />
                <p style="color:#888;font-size:0.9em;">Submitted on ${new Date().toLocaleString()}</p>
            `
        });

        tutor.lastVolunteerSubmission = { hours: currentHours, submittedAt: new Date() };
        await tutor.save();

        return NextResponse.json({
            success: true,
            currentHours: currentHours.toFixed(1),
            previousHours: previousHours.toFixed ? previousHours.toFixed(1) : '0.0',
            newHours: newHours.toFixed(1)
        });
    } catch (error) {
        console.error('Submit volunteer hours error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
