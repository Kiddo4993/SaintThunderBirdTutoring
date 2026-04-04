import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const tutors = await User.find({ userType: 'tutor', 'tutorApplication.status': 'approved' });
        const availableTutors = tutors.map((tutor) => ({
            _id: tutor._id,
            firstName: tutor.firstName,
            lastName: tutor.lastName,
            email: tutor.email,
            tutorProfile: tutor.tutorProfile || { subjects: [], bio: '' }
        }));
        return NextResponse.json({ success: true, tutors: availableTutors });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
