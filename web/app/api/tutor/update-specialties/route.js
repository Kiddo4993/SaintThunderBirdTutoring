import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { subjects } = await request.json();
        const tutor = await User.findByIdAndUpdate(authUser.userId, { 'tutorProfile.subjects': subjects }, { new: true });
        return NextResponse.json({ success: true, message: 'Specialties updated', tutorProfile: tutor.tutorProfile });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
