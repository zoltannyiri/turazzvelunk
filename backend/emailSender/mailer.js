const nodemailer = require('nodemailer');

const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const defaultFrom = process.env.EMAIL_FROM || 'Turazz Velunk <no-reply@turazzvelunk.local>';

const sendMail = async ({ to, subject, html, text, replyTo, from }) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP nincs beallitva. Ellenorizd az SMTP_* env valtozokat.');
    }
    return transporter.sendMail({
        from: from || defaultFrom,
        to,
        subject,
        html,
        text,
        ...(replyTo ? { replyTo } : {})
    });
};

module.exports = { sendMail };
