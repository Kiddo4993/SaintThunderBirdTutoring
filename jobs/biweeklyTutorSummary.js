const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const { ADMIN_EMAIL, sendEmail } = require('../services/emailService');

const SUMMARY_SETTING_KEY = 'biweeklyTutorSummary:lastSentAt';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function summarizeTutor(tutor) {
    const sessions = tutor.tutorSessions || [];
    const completedSessions = sessions.filter((session) => session.status === 'completed');
    const totalHours = completedSessions.reduce((sum, session) => sum + Number(session.hoursSpent || 0), 0);

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
            return {
                sent: false,
                reason: 'interval_not_elapsed',
                lastSentAt: existingSetting.valueDate
            };
        }
    }

    const tutors = await User.find({ userType: 'tutor' });
    const rows = tutors.map(summarizeTutor);

    const totalCompletedSessions = rows.reduce((sum, row) => sum + row.completedCount, 0);
    const totalHours = rows.reduce((sum, row) => sum + row.totalHours, 0);

    const tableRows = rows.length > 0
        ? rows.map((row) => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.fullName}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${row.email}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.completedCount}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.totalHours.toFixed(1)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align: center;">No tutors found.</td></tr>';

    const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
            <h2>Biweekly Tutor Summary</h2>
            <p><strong>Generated:</strong> ${now.toLocaleString()}</p>
            <p><strong>Total Completed Sessions:</strong> ${totalCompletedSessions}</p>
            <p><strong>Total Hours Taught:</strong> ${totalHours.toFixed(1)}</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
                <thead>
                    <tr style="background: #f3f3f3;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tutor</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Completed Sessions</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Hours Taught</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Biweekly Tutor Summary - ${now.toLocaleDateString()}`,
        html
    });

    // Send individual summary emails to each tutor
    const tutorEmails = rows.map((row) => {
        const tutorHtml = `
            <div style="font-family: Arial, sans-serif; color: #222;">
                <h2>Your Biweekly Tutoring Summary</h2>
                <p>Hi ${row.fullName},</p>
                <p>Here is your tutoring summary for the past two weeks:</p>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4a574; margin: 16px 0;">
                    <p><strong>Completed Sessions:</strong> ${row.completedCount}</p>
                    <p><strong>Total Hours Taught:</strong> ${row.totalHours.toFixed(1)}</p>
                </div>
                <p>Thank you for making a difference! Keep up the great work. 🌩️⚡</p>
                <p style="color: #888; font-size: 12px;">Saint Thunderbird Tutoring Platform</p>
            </div>
        `;
        return sendEmail({
            to: row.email,
            subject: `Your Tutoring Summary - ${now.toLocaleDateString()}`,
            html: tutorHtml
        }).catch((err) => {
            console.error(`❌ Failed to send summary to ${row.email}:`, err.message);
        });
    });

    await Promise.allSettled(tutorEmails);

    await SystemSetting.findOneAndUpdate(
        { key: SUMMARY_SETTING_KEY },
        { key: SUMMARY_SETTING_KEY, valueDate: now },
        { upsert: true, new: true }
    );

    return {
        sent: true,
        tutorCount: rows.length,
        totalCompletedSessions,
        totalHours: totalHours.toFixed(1),
        sentAt: now
    };
}

function startBiweeklyTutorSummaryScheduler() {
    const run = async () => {
        try {
            const result = await sendBiweeklyTutorSummary({ force: false });
            if (result.sent) {
                console.log('✅ Biweekly tutor summary email sent');
            } else {
                console.log('ℹ️ Biweekly tutor summary skipped:', result.reason || 'not_due');
            }
        } catch (error) {
            console.error('❌ Biweekly tutor summary failed:', error.message);
        }
    };

    run();

    const timer = setInterval(run, ONE_DAY_MS);
    if (typeof timer.unref === 'function') {
        timer.unref();
    }

    return timer;
}

module.exports = {
    sendBiweeklyTutorSummary,
    startBiweeklyTutorSummaryScheduler
};
