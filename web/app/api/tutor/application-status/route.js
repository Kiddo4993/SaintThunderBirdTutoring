import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const user = await User.findById(authUser.userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({
            success: true,
            status: user.tutorApplication?.status || 'not_applied',
            application: user.tutorApplication,
            userType: user.userType
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
