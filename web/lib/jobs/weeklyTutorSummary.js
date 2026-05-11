const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const { ADMIN_EMAIL, sendEmail } = require('../services/emailService');

const SUMMARY_SETTING_KEY = 'weeklyTutorSummary:lastSentAt';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function summarizeTutor(tutor, weekStart) {
    const sessions = tutor.tutorSessions || [];
    const completed = sessions.filter((s) => s.status === 'completed');

    const thisWeek = completed.filter((s) => s.completedAt && new Date(s.completedAt) >= weekStart);
    const weekSessions = thisWeek.length;
    const weekHours = thisWeek.reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0);

    const totalSessions = completed.length;
    const totalHours = completed.reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0);

    return {
        fullName: `${tutor.firstName} ${tutor.lastName}`,
        email: tutor.email,
        weekSessions,
        weekHours,
        totalSessions,
        totalHours
    };
}

async function sendWeeklyTutorSummary({ force = false } = {}) {
    const now = new Date();
    const weekStart = new Date(now.getTime() - SEVEN_DAYS_MS);

    const existingSetting = await SystemSetting.findOne({ key: SUMMARY_SETTING_KEY });

    if (!force && existingSetting?.valueDate) {
        const elapsedMs = now.getTime() - new Date(existingSetting.valueDate).getTime();
        if (elapsedMs < SEVEN_DAYS_MS) {
            return { sent: false, reason: 'interval_not_elapsed', lastSentAt: existingSetting.valueDate };
        }
    }

    const tutors = await User.find({ userType: 'tutor' });
    const rows = tutors.map((t) => summarizeTutor(t, weekStart));

    // Sort by week hours descending
    rows.sort((a, b) => b.weekHours - a.weekHours);

    const totalWeekSessions = rows.reduce((sum, r) => sum + r.weekSessions, 0);
    const totalWeekHours = rows.reduce((sum, r) => sum + r.weekHours, 0);
    const totalAllTimeHours = rows.reduce((sum, r) => sum + r.totalHours, 0);

    const tableRows = rows.length > 0
        ? rows.map((r) => `
            <tr style="background:${r.weekSessions > 0 ? '#fff' : '#fafafa'};">
                <td style="padding:8px;border:1px solid #ddd;">${r.fullName}</td>
                <td style="padding:8px;border:1px solid #ddd;">${r.email}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:${r.weekSessions > 0 ? 'bold' : 'normal'};">${r.weekSessions}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:${r.weekHours > 0 ? 'bold' : 'normal'};color:${r.weekHours > 0 ? '#1a6b2a' : '#999'};">${r.weekHours.toFixed(1)}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;color:#555;">${r.totalSessions}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;color:#555;">${r.totalHours.toFixed(1)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;text-align:center;">No tutors found.</td></tr>';

    const weekLabel = `${weekStart.toLocaleDateString()} – ${now.toLocaleDateString()}`;

    const html = `
        <div style="font-family:Arial,sans-serif;color:#222;max-width:700px;">
            <h2 style="color:#1a3c6b;">Weekly Tutor Hours Report</h2>
            <p style="color:#555;"><strong>Week:</strong> ${weekLabel}</p>
            <p style="color:#555;"><strong>Generated:</strong> ${now.toLocaleString()}</p>
            <div style="display:flex;gap:24px;margin:16px 0;">
                <div style="background:#e8f4fd;padding:12px 20px;border-radius:6px;">
                    <div style="font-size:24px;font-weight:bold;color:#1a3c6b;">${totalWeekHours.toFixed(1)}</div>
                    <div style="font-size:12px;color:#555;">Hours This Week</div>
                </div>
                <div style="background:#e8f4fd;padding:12px 20px;border-radius:6px;">
                    <div style="font-size:24px;font-weight:bold;color:#1a3c6b;">${totalWeekSessions}</div>
                    <div style="font-size:12px;color:#555;">Sessions This Week</div>
                </div>
                <div style="background:#f0f0f0;padding:12px 20px;border-radius:6px;">
                    <div style="font-size:24px;font-weight:bold;color:#555;">${totalAllTimeHours.toFixed(1)}</div>
                    <div style="font-size:12px;color:#555;">All-Time Hours</div>
                </div>
            </div>
            <table style="border-collapse:collapse;width:100%;margin-top:8px;">
                <thead>
                    <tr style="background:#1a3c6b;color:#fff;">
                        <th style="padding:10px 8px;border:1px solid #ddd;text-align:left;">Tutor</th>
                        <th style="padding:10px 8px;border:1px solid #ddd;text-align:left;">Email</th>
                        <th style="padding:10px 8px;border:1px solid #ddd;text-align:center;">Sessions (Week)</th>
                        <th style="padding:10px 8px;border:1px solid #ddd;text-align:center;">Hours (Week)</th>
                        <th style="padding:10px 8px;border:1px solid #ddd;text-align:center;">Sessions (Total)</th>
                        <th style="padding:10px 8px;border:1px solid #ddd;text-align:center;">Hours (Total)</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <p style="font-size:12px;color:#999;margin-top:16px;">Saint Thunderbird Tutoring — automated weekly report</p>
        </div>
    `;

    await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Weekly Tutor Report — ${weekLabel}`,
        html
    });

    await SystemSetting.findOneAndUpdate(
        { key: SUMMARY_SETTING_KEY },
        { key: SUMMARY_SETTING_KEY, valueDate: now },
        { upsert: true }
    );

    return { sent: true, tutorCount: rows.length, totalWeekHours, totalWeekSessions };
}

module.exports = { sendWeeklyTutorSummary };
