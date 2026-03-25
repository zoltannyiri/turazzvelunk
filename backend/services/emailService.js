const db = require('../config/db');
const { sendMail } = require('../emailSender/mailer');
const {
    buildRegistrationEmail,
    buildBookingEmail,
    buildBookingCancelledEmail,
    buildAdminRemovedBookingEmail,
    buildCancellationRequestEmail,
    buildAdminCancellationRequestEmail,
    buildPaymentEmail,
    buildAdminPaymentEmail,
    buildAdminEmail,
    buildAccountDeletedEmail
} = require('./emailTemplates');

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

const sendBookingCancelledEmail = async ({ to, name, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildBookingCancelledEmail({
        name,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendAdminRemovedBookingEmail = async ({ to, name, tourTitle, adminName, startDate, endDate }) => {
    const { subject, text, html } = buildAdminRemovedBookingEmail({
        name,
        tourTitle,
        adminName,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendCancellationRequestEmail = async ({ to, name, tourTitle, reason, startDate, endDate }) => {
    const { subject, text, html } = buildCancellationRequestEmail({
        name,
        tourTitle,
        reason,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendAdminCancellationRequestEmail = async ({ to, userName, userEmail, tourTitle, reason, startDate, endDate }) => {
    const { subject, text, html } = buildAdminCancellationRequestEmail({
        userName,
        userEmail,
        tourTitle,
        reason,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendPaymentEmail = async ({ to, name, tourTitle, amount, startDate, endDate }) => {
    const { subject, text, html } = buildPaymentEmail({
        name,
        tourTitle,
        amount,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendAdminPaymentEmail = async ({ to, userName, tourTitle, amount, startDate, endDate }) => {
    const { subject, text, html } = buildAdminPaymentEmail({
        userName,
        tourTitle,
        amount,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendAccountDeletedEmail = async ({ to, name }) => {
    const { subject, text, html } = buildAccountDeletedEmail({ name });
    return sendMail({ to, subject, text, html });
};

const sendAdminNotification = async ({ subject, message }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminEmail({ to: email, subject, message }))
    );
};

const sendAdminPaymentNotification = async ({ userName, tourTitle, amount, startDate, endDate }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminPaymentEmail({
            to: email,
            userName,
            tourTitle,
            amount,
            startDate,
            endDate
        }))
    );
};

const sendAdminCancellationRequestNotification = async ({ userName, userEmail, tourTitle, reason, startDate, endDate }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminCancellationRequestEmail({
            to: email,
            userName,
            userEmail,
            tourTitle,
            reason,
            startDate,
            endDate
        }))
    );
};

module.exports = {
    sendRegistrationEmail,
    sendBookingEmail,
    sendBookingCancelledEmail,
    sendAdminRemovedBookingEmail,
    sendCancellationRequestEmail,
    sendAdminCancellationRequestEmail,
    sendPaymentEmail,
    sendAdminPaymentEmail,
    sendAdminEmail,
    sendAdminNotification,
    sendAdminCancellationRequestNotification,
    sendAdminPaymentNotification,
    sendAccountDeletedEmail
};
