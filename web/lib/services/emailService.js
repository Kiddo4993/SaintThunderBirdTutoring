const nodemailer = require('nodemailer');

const ADMIN_EMAIL = 'dylanduancanada@gmail.com';
let transporter;

function getEmailProvider() {
    return (process.env.EMAIL_PROVIDER || 'nodemailer').toLowerCase();
}

function getDefaultFromAddress() {
    return process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@saintthunderbirdtutoring.local';
}

function getTransporter() {
    if (transporter) return transporter;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Email credentials missing: set EMAIL_USER and EMAIL_PASSWORD');
        return null;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        pool: true,
        maxConnections: 1,
        maxMessages: 5
    });

    transporter.verify((error) => {
        if (error) console.error('❌ Nodemailer verify failed:', error.message);
        else console.log('✅ Nodemailer transporter ready');
    });

    return transporter;
}

async function sendViaNodemailer(mailOptions) {
    const t = getTransporter();
    if (!t) throw new Error('Nodemailer transporter unavailable');
    return t.sendMail(mailOptions);
}

async function sendViaMailchimp(mailOptions) {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    if (!apiKey) throw new Error('MAILCHIMP_API_KEY is required when EMAIL_PROVIDER=mailchimp');

    const recipients = String(mailOptions.to || '')
        .split(',').map((e) => e.trim()).filter(Boolean).map((e) => ({ email: e, type: 'to' }));

    if (recipients.length === 0) throw new Error('Mailchimp send requires at least one recipient');

    const fromRaw = mailOptions.from || getDefaultFromAddress();
    const fromEmail = String(fromRaw).match(/<([^>]+)>/)?.[1] || fromRaw;
    const fromName = process.env.MAILCHIMP_FROM_NAME || 'Saint Thunderbird Tutoring';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                key: apiKey,
                message: {
                    from_email: fromEmail,
                    from_name: fromName,
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    text: mailOptions.text,
                    to: recipients
                }
            })
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Mailchimp API failed (${response.status}): ${body.slice(0, 300)}`);
        }

        const result = await response.json();
        if (!Array.isArray(result)) throw new Error('Unexpected Mailchimp response format');

        const badStatuses = result.filter((item) => ['rejected', 'invalid'].includes(item.status));
        if (badStatuses.length > 0) {
            const reason = badStatuses.map((item) => `${item.email}: ${item.reject_reason || item.status}`).join('; ');
            throw new Error(`Mailchimp rejected message: ${reason}`);
        }

        return result;
    } finally {
        clearTimeout(timeout);
    }
}

async function sendEmail({ to, subject, html, text, from }) {
    if (!to || !subject || (!html && !text)) {
        throw new Error('sendEmail requires to, subject, and html/text');
    }

    const mailOptions = { from: from || getDefaultFromAddress(), to, subject, html, text };
    const provider = getEmailProvider();

    if (provider === 'mailchimp') return sendViaMailchimp(mailOptions);
    return sendViaNodemailer(mailOptions);
}

module.exports = { ADMIN_EMAIL, sendEmail };
