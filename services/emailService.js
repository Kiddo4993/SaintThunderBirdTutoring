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
    if (transporter) {
        return transporter;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Email credentials missing: set EMAIL_USER and EMAIL_PASSWORD');
        return null;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        pool: true,
        maxConnections: 1,
        maxMessages: 5
    });

    transporter.verify((error) => {
        if (error) {
            console.error('❌ Nodemailer verify failed:', error.message);
        } else {
            console.log('✅ Nodemailer transporter ready');
        }
    });

    return transporter;
}

async function sendViaNodemailer(mailOptions) {
    const mailTransporter = getTransporter();

    if (!mailTransporter) {
        throw new Error('Nodemailer transporter unavailable');
    }

    return mailTransporter.sendMail(mailOptions);
}

async function sendViaMailchimp(mailOptions) {
    // Mailchimp adapter hook: replace this implementation with a real Mailchimp Transactional send.
    if (!process.env.MAILCHIMP_API_KEY) {
        console.warn('⚠️ EMAIL_PROVIDER=mailchimp but MAILCHIMP_API_KEY is not configured. Falling back to nodemailer.');
        return sendViaNodemailer(mailOptions);
    }

    console.warn('⚠️ Mailchimp provider hook not implemented yet. Falling back to nodemailer.');
    return sendViaNodemailer(mailOptions);
}

async function sendEmail({ to, subject, html, text, from }) {
    if (!to || !subject || (!html && !text)) {
        throw new Error('sendEmail requires to, subject, and html/text');
    }

    const mailOptions = {
        from: from || getDefaultFromAddress(),
        to,
        subject,
        html,
        text
    };

    const provider = getEmailProvider();

    if (provider === 'mailchimp') {
        return sendViaMailchimp(mailOptions);
    }

    return sendViaNodemailer(mailOptions);
}

module.exports = {
    ADMIN_EMAIL,
    sendEmail
};
