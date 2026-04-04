const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const { ADMIN_EMAIL, sendEmail } = require('../services/emailService');

const SUMMARY_SETTING_KEY = 'biweeklyTutorSummary:lastSentAt';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function summarizeTutor(tutor) {
    const sessions = tutor.tutorSessions || [];
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    const totalHours = completedSessions.reduce((sum, s) => sum + Number(s.hoursSpent || 0), 0);
    return {
        fullName: `${tutor.firstName} ${tutor.lastName}`,
        email: tutor.email,
        completedCount: completedSessions.length,
        totalHours
    };
}

async function sendBiweeklyTutorSummary({ force = false } = {}) {
    const now = new Date();
    const existingSetting = await SystemSetting.findOne({ key: SUMMARY_SETTING_KEY });

    if (!force && existingSetting?.valueDate) {
        const elapsedMs = now.getTime() - new Date(existingSetting.valueDate).getTime();
        if (elapsedMs < FOURTEEN_DAYS_MS) {
            return { sent: false, reason: 'interval_not_elapsed', lastSentAt: existingSetting.valueDate };
        }
    }

    const tutors = await User.find({ userType: 'tutor' });
    const rows = tutors.map(summarizeTutor);

    const totalCompletedSessions = rows.reduce((sum, row) => sum + row.completedCount, 0);
    const totalHours = rows.reduce((sum, row) => sum + row.totalHours, 0);

    const tableRows = rows.length > 0
        ? rows.map((row) => `
            <tr>
                <td style="padding:8px;border:1px solid #ddd;">${row.fullName}</td>
                <td style="padding:8px;border:1px solid #ddd;">${row.email}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;">${row.completedCount}</td>
                <td style="padding:8px;border:1px solid #ddd;text-align:center;">${row.totalHours.toFixed(1)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:center;">No tutors found.</td></tr>';

    const html = `
        <div style="font-family:Arial,sans-serif;color:#222;">
            <h2>Biweekly Tutor Summary</h2>
            <p><strong>Generated:</strong> ${now.toLocaleString()}</p>
            <p><strong>Total Completed Sessions:</strong> ${totalCompletedSessions}</p>
            <p><strong>Total Hours Taught:</strong> ${totalHours.toFixed(1)}</p>
            <table style="border-collapse:collapse;width:100%;margin-top:16px;">
                <thead>
                    <tr>
                        <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Name</th>
                        <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Email</th>
                        <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Sessions</th>
                        <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Hours</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Biweekly Tutor Summary — ${now.toLocaleDateString()}`,
        html
    });

    await SystemSetting.findOneAndUpdate(
        { key: SUMMARY_SETTING_KEY },
        { key: SUMMARY_SETTING_KEY, valueDate: now },
        { upsert: true }
    );

    return { sent: true, tutorCount: rows.length, totalHours, totalCompletedSessions };
}

module.exports = { sendBiweeklyTutorSummary };
