const db = require('../config/db');
const { createNotifications } = require('./notificationService');
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
    buildAccountDeletedEmail,
    buildPasswordResetEmail
} = require('./emailTemplates');

const getAdminUsers = async (tourId = null) => {
    let sql = 'SELECT id, email FROM users WHERE role = ? AND email IS NOT NULL AND email <> ?';
    let params = ['admin', ''];
    if (tourId) {
        sql = `SELECT DISTINCT u.id, u.email 
               FROM users u 
               LEFT JOIN tours t ON t.created_by = u.id AND t.id = ?
               WHERE (u.role = ? OR t.id = ?) AND u.email IS NOT NULL AND u.email <> ''`;
        params = [tourId, 'admin', tourId, ''];
    }
    const [rows] = await db.query(sql, params);
    return rows;
};

const getAdminRecipients = async (tourId = null) => {
    const users = await getAdminUsers(tourId);
    return users.map((row) => row.email).filter(Boolean);
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

const sendPaymentEmail = async ({ to, name, tourId, tourTitle, amount, startDate, endDate, paymentType, totalAmount }) => {
    const { subject, text, html } = buildPaymentEmail({
        name,
        tourTitle,
        amount,
        startDate,
        endDate,
        paymentType,
        totalAmount
    });
    const notifTitle = paymentType === 'deposit'
        ? `Sikeres előlegfizetés: ${tourTitle}`
        : paymentType === 'remainder'
            ? `Sikeres hátralékfizetés: ${tourTitle}`
            : `Sikeres fizetés: ${tourTitle}`;
    const notifMsg = paymentType === 'deposit'
        ? `${formatAmount(amount)} előleg befizetését rögzítettük.`
        : `${formatAmount(amount)} befizetését rögzítettük.`;

    return sendMail({
        to,
        subject,
        text,
        html,
        notification: tourNotification(tourId, notifTitle, notifMsg)
    });
};

const sendAdminPaymentEmail = async ({ to, userName, tourTitle, amount, startDate, endDate, paymentType, totalAmount }) => {
    const { subject, text, html } = buildAdminPaymentEmail({
        userName,
        tourTitle,
        amount,
        startDate,
        endDate,
        paymentType,
        totalAmount
    });
    return sendMail({ to, subject, text, html });
};

const sendAccountDeletedEmail = async ({ to, name }) => {
    const { subject, text, html } = buildAccountDeletedEmail({ name });
    return sendMail({ to, subject, text, html });
};

const sendAdminNotification = async ({ subject, message, tourId = null, tourTitle = null, userName = null, notification = null }) => {
    const adminUsers = await getAdminUsers(tourId);
    if (!adminUsers.length) return;

    const notifObj = notification || {
        type: 'tour',
        title: tourTitle ? `Új jelentkezés: ${tourTitle}` : (subject || 'Értesítés adminisztrátornak'),
        message: userName ? `${userName} jelentkezett a túrára. Jóváhagyásra vár.` : (message || null),
        link: tourId ? `/tours/${tourId}` : '/admin'
    };

    try {
        await createNotifications({
            userIds: adminUsers.map((u) => u.id),
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            link: notifObj.link
        });
    } catch (notifErr) {
        console.error('Admin in-app értesítés mentési hiba:', notifErr.message);
    }

    await Promise.all(
        adminUsers.map((user) => sendAdminEmail({
            to: user.email,
            subject,
            message
        }))
    );
};

const sendAdminPaymentNotification = async ({ userName, tourTitle, tourId = null, amount, startDate, endDate, paymentType, totalAmount }) => {
    const adminUsers = await getAdminUsers(tourId);
    if (!adminUsers.length) return;

    let notifTitle = `Fizetés rögzítve: ${tourTitle || 'Túra'}`;
    let notifMsg = `${userName || 'Résztvevő'} befizetett ${formatAmount(amount)}.`;
    if (paymentType === 'deposit') {
        notifTitle = `Előleg befizetve: ${tourTitle || 'Túra'}`;
        notifMsg = `${userName || 'Résztvevő'} befizette az előleget (${formatAmount(amount)}).`;
    } else if (paymentType === 'remainder') {
        notifTitle = `Hátralék befizetve: ${tourTitle || 'Túra'}`;
        notifMsg = `${userName || 'Résztvevő'} befizette a hátralékot (${formatAmount(amount)}). A túra teljesen kifizetve.`;
    } else if (paymentType === 'full') {
        notifTitle = `Teljes díj befizetve: ${tourTitle || 'Túra'}`;
        notifMsg = `${userName || 'Résztvevő'} kifizette a teljes részvételi díjat (${formatAmount(amount)}).`;
    }

    const notifObj = {
        type: 'tour',
        title: notifTitle,
        message: notifMsg,
        link: tourId ? `/tours/${tourId}` : '/admin'
    };

    try {
        await createNotifications({
            userIds: adminUsers.map((u) => u.id),
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            link: notifObj.link
        });
    } catch (notifErr) {
        console.error('Admin payment in-app értesítés hiba:', notifErr.message);
    }

    await Promise.all(
        adminUsers.map((user) => sendAdminPaymentEmail({
            to: user.email,
            userName,
            tourTitle,
            amount,
            startDate,
            endDate,
            paymentType,
            totalAmount
        }))
    );
};

const sendAdminCancellationRequestNotification = async ({ userName, userEmail, tourTitle, tourId = null, reason, startDate, endDate }) => {
    const adminUsers = await getAdminUsers(tourId);
    if (!adminUsers.length) return;

    const notifObj = {
        type: 'tour',
        title: `Lejelentkezési kérelem: ${tourTitle || 'Túra'}`,
        message: `${userName || 'Egy résztvevő'} lejelentkezési kérelmet küldött${reason ? `: "${reason}"` : '.'}`,
        link: '/admin?tab=cancellations'
    };

    try {
        await createNotifications({
            userIds: adminUsers.map((u) => u.id),
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            link: notifObj.link
        });
    } catch (notifErr) {
        console.error('Admin lejelentkezési kérelem in-app értesítés hiba:', notifErr.message);
    }

    await Promise.all(
        adminUsers.map((user) => sendAdminCancellationRequestEmail({
            to: user.email,
            userName,
            userEmail,
            tourTitle,
            reason,
            startDate,
            endDate
        }))
    );
};

const sendAdminCancellationApprovedNotification = async ({ userName, userEmail, tourTitle, tourId = null, startDate, endDate }) => {
    const adminUsers = await getAdminUsers(tourId);
    if (!adminUsers.length) return;

    const notifObj = {
        type: 'tour',
        title: `Lejelentkezés elfogadva: ${tourTitle || 'Túra'}`,
        message: `${userName || 'Egy résztvevő'} lejelentkezése jóváhagyva a(z) ${tourTitle || 'túrán'}.`,
        link: tourId ? `/tours/${tourId}` : '/admin?tab=cancellations'
    };

    try {
        await createNotifications({
            userIds: adminUsers.map((u) => u.id),
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            link: notifObj.link
        });
    } catch (notifErr) {
        console.error('Admin cancellation approved in-app értesítés hiba:', notifErr.message);
    }

    await Promise.all(
        adminUsers.map((user) => sendAdminCancellationApprovedEmail({
            to: user.email,
            userName,
            userEmail,
            tourTitle,
            startDate,
            endDate
        }))
    );
};

const sendAdminRemovedBookingNotification = async ({ adminName, userName, userEmail, tourTitle, tourId = null, startDate, endDate }) => {
    const adminUsers = await getAdminUsers(tourId);
    if (!adminUsers.length) return;

    const notifObj = {
        type: 'tour',
        title: `Jelentkezés törölve: ${tourTitle || 'Túra'}`,
        message: `${adminName || 'Adminisztrátor'} törölte ${userName || 'egy résztvevő'} jelentkezését.`,
        link: tourId ? `/tours/${tourId}` : '/admin'
    };

    try {
        await createNotifications({
            userIds: adminUsers.map((u) => u.id),
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            link: notifObj.link
        });
    } catch (notifErr) {
        console.error('Admin removed booking in-app értesítés hiba:', notifErr.message);
    }

    await Promise.all(
        adminUsers.map((user) => sendAdminRemovedBookingNotificationEmail({
            to: user.email,
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

const sendAdminWaitlistNotification = async ({ userName, userEmail, tourTitle, tourId = null, startDate, endDate }) => {
    const adminUsers = await getAdminUsers(tourId);
    if (!adminUsers.length) return;

    const notifObj = {
        type: 'tour',
        title: `Új várólistás: ${tourTitle || 'Túra'}`,
        message: `${userName || 'Egy résztvevő'} feliratkozott a(z) ${tourTitle || 'túra'} várólistájára.`,
        link: tourId ? `/tours/${tourId}` : '/admin'
    };

    try {
        await createNotifications({
            userIds: adminUsers.map((u) => u.id),
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            link: notifObj.link
        });
    } catch (notifErr) {
        console.error('Admin waitlist in-app értesítés hiba:', notifErr.message);
    }

    await Promise.all(
        adminUsers.map((user) => sendAdminWaitlistEmail({
            to: user.email,
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


const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const { subject, text, html } = buildPasswordResetEmail({ name, resetUrl });
    return sendMail({
        to,
        subject,
        text,
        html
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
    sendAccountDeletedEmail,
    sendPasswordResetEmail
};
