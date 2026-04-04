import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function GET(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const user = await User.findById(authUser.userId).select('-password');
        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
