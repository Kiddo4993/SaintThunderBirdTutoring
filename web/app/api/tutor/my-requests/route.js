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
            return NextResponse.json({ error: 'Only students can view their requests' }, { status: 403 });
        }
        return NextResponse.json({ success: true, requests: student.tutorRequests || [] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
