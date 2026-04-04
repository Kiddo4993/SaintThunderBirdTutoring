import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { sendBiweeklyTutorSummary } from '@/lib/jobs/biweeklyTutorSummary';

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        await connectDB();
        const result = await sendBiweeklyTutorSummary({ force: true });
        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
