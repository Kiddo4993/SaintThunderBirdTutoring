import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/authHelper';

export async function POST(request) {
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorized();
    try {
        await connectDB();
        const { interests, grade } = await request.json();
        await User.findByIdAndUpdate(authUser.userId, { grade, interests }, { new: true });
        return NextResponse.json({ success: true, message: 'Preferences updated', preferences: { interests, grade } });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
