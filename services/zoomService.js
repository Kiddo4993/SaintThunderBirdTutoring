function buildFallbackMeeting(durationMinutes = 60) {
    const meetingId = 'STB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const password = '';
    // NOTE: Without Zoom API credentials, we can't generate real meeting links.
    // The tutor and student will coordinate via email instead.
    const joinUrl = '';
    console.warn('⚠️ Zoom API credentials not configured. Session created without a meeting link. Tutor and student will coordinate via email.');
    return {
        provider: 'fallback',
        id: meetingId,
        password,
        joinUrl,
        durationMinutes
    };
}

async function getZoomAccessToken() {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
        return null;
    }

    if (typeof fetch !== 'function') {
        throw new Error('Global fetch is unavailable; Zoom provider requires Node 18+');
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`
        }
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Zoom OAuth failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Zoom OAuth response missing access_token');
    }

    return data.access_token;
}

async function createZoomMeeting({ topic, durationMinutes = 60, startTime }) {
    const token = await getZoomAccessToken();
    if (!token) {
        return buildFallbackMeeting(durationMinutes);
    }

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            topic: topic || 'Saint Thunderbird Tutoring Session',
            type: 2,
            start_time: (startTime || new Date(Date.now() + 24 * 60 * 60 * 1000)).toISOString(),
            duration: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60,
            timezone: 'UTC',
            settings: {
                join_before_host: true,
                waiting_room: false
            }
        })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Zoom meeting creation failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const meeting = await response.json();
    return {
        provider: 'zoom',
        id: meeting.id,
        password: meeting.password || '',
        joinUrl: meeting.join_url,
        durationMinutes: meeting.duration || durationMinutes
    };
}

async function createSessionMeeting({ topic, durationMinutes, startTime }) {
    try {
        return await createZoomMeeting({ topic, durationMinutes, startTime });
    } catch (error) {
        console.error('⚠️ Zoom API unavailable, using fallback meeting link:', error.message);
        return buildFallbackMeeting(durationMinutes);
    }
}

module.exports = {
    createSessionMeeting
};
