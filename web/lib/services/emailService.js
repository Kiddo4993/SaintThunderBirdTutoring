const { Resend } = require('resend');

const ADMIN_EMAIL = 'dylanduancanada@gmail.com';
const FROM_ADDRESS = 'Saint Thunderbird Tutoring <noreply@saintthunderbirdtutoring.dylanduan2010.dev>';

let resend;
function getResend() {
    if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
    return resend;
}

async function sendEmail({ to, subject, html, text }) {
    if (!to || !subject || (!html && !text)) {
        throw new Error('sendEmail requires to, subject, and html/text');
    }
    const client = getResend();
    const { error } = await client.emails.send({
        from: FROM_ADDRESS,
        to: Array.isArray(to) ? to : to.split(',').map((e) => e.trim()),
        subject,
        html: html || undefined,
        text: text || undefined,
    });
    if (error) throw new Error(error.message);
}

module.exports = { ADMIN_EMAIL, sendEmail };
