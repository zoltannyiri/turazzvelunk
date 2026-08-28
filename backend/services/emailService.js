const db = require('../config/db');
const { sendMail } = require('../emailSender/mailer');
const {
    buildRegistrationEmail,
    buildBookingEmail,
    buildBookingApprovedEmail,
    buildWaitlistJoinedEmail,
    buildAdminWaitlistNotificationEmail,
    buildWaitlistPromotedEmail,
    buildBookingCancelledEmail,
    buildAdminRemovedBookingEmail,
    buildAdminRemovedBookingNotificationEmail,
    buildCancellationRequestEmail,
    buildCancellationRejectedEmail,
    buildAdminCancellationRequestEmail,
    buildAdminCancellationApprovedEmail,
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

const formatAmount = (amount) => `${new Intl.NumberFormat('hu-HU').format(Number(amount || 0))} Ft`;
const tourNotification = (tourId, title, message) => ({
    type: 'tour',
    title,
    message,
    link: tourId ? `/tours/${tourId}` : null
});

const sendRegistrationEmail = async ({ to, name }) => {
    const { subject, text, html } = buildRegistrationEmail({ name });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: {
            type: 'account',
            title: 'Üdv a Túrázz Velünk közösségében!',
            message: 'A regisztrációd sikeresen elkészült.',
            link: '/profile'
        }
    });
};

const sendBookingApprovedEmail = async ({ to, name, tourId, tourTitle, startDate, endDate, totalPrice }) => {
    const { subject, text, html } = buildBookingApprovedEmail({
        name,
        tourTitle,
        startDate,
        endDate,
        totalPrice
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(
            tourId,
            `Jelentkezésed jóváhagyva: ${tourTitle}`,
            `Már csak a ${formatAmount(totalPrice)} részvételi díj befizetése van hátra.`
        )
    });
};

const sendBookingEmail = async ({ to, name, tourId, tourTitle, startDate, endDate, totalPrice }) => {
    const { subject, text, html } = buildBookingEmail({
        name,
        tourTitle,
        startDate,
        endDate,
        totalPrice
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(
            tourId,
            `Jelentkezés elküldve: ${tourTitle}`,
            'A jelentkezésed jóváhagyásra vár.'
        )
    });
};

const sendAdminEmail = async ({ to, subject, message }) => {
    const { text, html } = buildAdminEmail({ subject, message });
    return sendMail({ to, subject, text, html });
};

const sendBookingCancelledEmail = async ({ to, name, tourId, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildBookingCancelledEmail({
        name,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, `Jelentkezés lemondva: ${tourTitle}`, 'A lejelentkezésedet rögzítettük.')
    });
};

const sendAdminRemovedBookingEmail = async ({ to, name, tourId, tourTitle, adminName, startDate, endDate }) => {
    const { subject, text, html } = buildAdminRemovedBookingEmail({
        name,
        tourTitle,
        adminName,
        startDate,
        endDate
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, `Jelentkezésed törölve: ${tourTitle}`, 'Az adminisztrátor törölte a jelentkezésedet.')
    });
};

const sendAdminRemovedBookingNotificationEmail = async ({ to, adminName, userName, userEmail, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildAdminRemovedBookingNotificationEmail({
        adminName,
        userName,
        userEmail,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendCancellationRequestEmail = async ({ to, name, tourId, tourTitle, reason, startDate, endDate }) => {
    const { subject, text, html } = buildCancellationRequestEmail({
        name,
        tourTitle,
        reason,
        startDate,
        endDate
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, `Lejelentkezési kérelem elküldve: ${tourTitle}`, 'A kérelmed elbírálásra vár.')
    });
};

const sendCancellationRejectedEmail = async ({ to, name, tourId, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildCancellationRejectedEmail({
        name,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, `Lejelentkezési kérelem elutasítva: ${tourTitle}`, 'A jelentkezésed továbbra is aktív.')
    });
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

const sendAdminCancellationApprovedEmail = async ({ to, userName, userEmail, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildAdminCancellationApprovedEmail({
        userName,
        userEmail,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendPaymentEmail = async ({ to, name, tourId, tourTitle, amount, startDate, endDate }) => {
    const { subject, text, html } = buildPaymentEmail({
        name,
        tourTitle,
        amount,
        startDate,
        endDate
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, `Sikeres fizetés: ${tourTitle}`, `${formatAmount(amount)} befizetését rögzítettük.`)
    });
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

const sendAdminCancellationApprovedNotification = async ({ userName, userEmail, tourTitle, startDate, endDate }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminCancellationApprovedEmail({
            to: email,
            userName,
            userEmail,
            tourTitle,
            startDate,
            endDate
        }))
    );
};

const sendAdminRemovedBookingNotification = async ({ adminName, userName, userEmail, tourTitle, startDate, endDate }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminRemovedBookingNotificationEmail({
            to: email,
            adminName,
            userName,
            userEmail,
            tourTitle,
            startDate,
            endDate
        }))
    );
};


const sendWaitlistJoinedEmail = async ({ to, name, tourId, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildWaitlistJoinedEmail({
        name,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, `Várólistára kerültél: ${tourTitle}`, 'Értesítünk, ha felszabadul egy hely.')
    });
};

const sendAdminWaitlistEmail = async ({ to, userName, userEmail, tourTitle, startDate, endDate }) => {
    const { subject, text, html } = buildAdminWaitlistNotificationEmail({
        userName,
        userEmail,
        tourTitle,
        startDate,
        endDate
    });
    return sendMail({ to, subject, text, html });
};

const sendAdminWaitlistNotification = async ({ userName, userEmail, tourTitle, startDate, endDate }) => {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    await Promise.all(
        recipients.map((email) => sendAdminWaitlistEmail({
            to: email,
            userName,
            userEmail,
            tourTitle,
            startDate,
            endDate
        }))
    );
};

const sendWaitlistPromotedEmail = async ({ to, name, tourId, tourTitle, startDate, endDate, totalPrice }) => {
    const { subject, text, html } = buildWaitlistPromotedEmail({
        name,
        tourTitle,
        startDate,
        endDate,
        totalPrice
    });
    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(
            tourId,
            `Felszabadult egy hely: ${tourTitle}`,
            `A jelentkezésed aktív. Fizetendő: ${formatAmount(totalPrice)}.`
        )
    });
};

module.exports = {
    sendRegistrationEmail,
    sendBookingEmail,
    sendBookingApprovedEmail,
    sendWaitlistJoinedEmail,
    sendAdminWaitlistNotification,
    sendWaitlistPromotedEmail,
    sendBookingCancelledEmail,
    sendAdminRemovedBookingEmail,
    sendAdminRemovedBookingNotificationEmail,
    sendCancellationRequestEmail,
    sendCancellationRejectedEmail,
    sendAdminCancellationRequestEmail,
    sendAdminCancellationApprovedEmail,
    sendPaymentEmail,
    sendAdminPaymentEmail,
    sendAdminEmail,
    sendAdminNotification,
    sendAdminCancellationRequestNotification,
    sendAdminCancellationApprovedNotification,
    sendAdminRemovedBookingNotification,
    sendAdminPaymentNotification,
    sendAccountDeletedEmail
};
