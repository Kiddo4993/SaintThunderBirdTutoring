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
            return NextResponse.json({ error: 'Only tutors can view requests' }, { status: 403 });
        }

        const tutorSubjects = tutor.tutorProfile?.subjects?.length > 0
            ? tutor.tutorProfile.subjects
            : (tutor.tutorApplication?.subjects || []);

        const students = await User.find({ userType: 'student', tutorRequests: { $exists: true } });

        const requests = [];
        students.forEach((student) => {
            if (!Array.isArray(student.tutorRequests)) return;
            student.tutorRequests.forEach((req, index) => {
                const hasGeneral = tutorSubjects.some((s) => s === 'General' || s === 'General Help');
                const reqSubject = req.subject || '';
                const subjectMatches = hasGeneral || tutorSubjects.includes(reqSubject) || tutorSubjects.length === 0;
                const requestTutorMatches = !req.requestedTutorId || req.requestedTutorId.toString() === tutor._id.toString();

                if (req.status === 'pending' && subjectMatches && requestTutorMatches) {
                    requests.push({
                        _id: req._id?.toString() || `${student._id}-${index}`,
                        studentId: student._id,
                        requestIndex: index,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentEmail: student.email,
                        grade: student.grade || 'N/A',
                        subject: req.subject,
                        description: req.description,
                        priority: req.priority,
                        requestedTime: req.requestedTime,
                        createdAt: req.createdAt
                    });
                }
            });
        });

        return NextResponse.json({
            success: true,
            requests: requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
