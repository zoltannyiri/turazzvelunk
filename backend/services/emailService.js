const db = require('../config/db');
const { sendMail } = require('../emailSender/mailer');
const { buildRegistrationEmail, buildBookingEmail, buildBookingCancelledEmail, buildPaymentEmail, buildAdminEmail } = require('./emailTemplates');

const getAdminRecipients = async () => {
    const [rows] = await db.query(
        'SELECT email FROM users WHERE role = ? AND email IS NOT NULL AND email <> ?',
        ['admin', '']
    );
    return rows.map((row) => row.email).filter(Boolean);
};

const sendRegistrationEmail = async ({ to, name }) => {
    const { subject, text, html } = buildRegistrationEmail({ name });
    return sendMail({ to, subject, text, html });
};

const sendBookingEmail = async ({ to, name, tourTitle, startDate, endDate, totalPrice }) => {
    const { subject, text, html } = buildBookingEmail({
        name,
        tourTitle,
        startDate,
        endDate,
        totalPrice
    });
    return sendMail({ to, subject, text, html });
};

const sendAdminEmail = async ({ to, subject, message }) => {
    const { text, html } = buildAdminEmail({ subject, message });
    return sendMail({ to, subject, text, html });
};

const sendBookingCancelledEmail = async ({ to, name, tourTitle }) => {
    const { subject, text, html } = buildBookingCancelledEmail({ name, tourTitle });
    return sendMail({ to, subject, text, html });
};

const sendPaymentEmail = async ({ to, name, tourTitle, amount }) => {
    const { subject, text, html } = buildPaymentEmail({ name, tourTitle, amount });
    return sendMail({ to, subject, text, html });
};

const sendAdminNotification = async ({ subject, message }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminEmail({ to: email, subject, message }))
    );
};

module.exports = {
    sendRegistrationEmail,
    sendBookingEmail,
    sendBookingCancelledEmail,
    sendPaymentEmail,
    sendAdminEmail,
    sendAdminNotification
};
