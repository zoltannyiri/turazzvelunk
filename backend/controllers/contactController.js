const { sendMail } = require('../emailSender/mailer');
const db = require('../config/db');

exports.sendContactEmail = async (req, res) => {
    const { subject, message } = req.body || {};
    const userId = req.user?.id;

    if (!subject || !subject.trim()) {
        return res.status(400).json({ message: 'A tárgy megadása kötelező.' });
    }
    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Az üzenet megadása kötelező.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'Hiányzik a felhasználó azonosítása.' });
    }

    const [userRows] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0 || !userRows[0].email) {
        return res.status(400).json({ message: 'Hiányzik a felhasználó email címe.' });
    }
    const userName = userRows[0].name || 'Ismeretlen felhasználó';
    const userEmail = userRows[0].email;

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    if (!supportEmail) {
        return res.status(500).json({ message: 'Support email nincs beállítva.' });
    }

    const mailSubject = `Ügyfélszolgálati Üzenet – ${subject.trim()}`;
    const text = `Feladó: ${userName} (${userEmail})\nTárgy: ${subject.trim()}\n\n${message.trim()}`;
    const html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
            <div style="font-weight: 700; margin: 0 0 12px;">Ügyfélszolgálati Üzenet</div>
            <div style="margin-bottom: 6px;">Feladó: <strong>${userName}</strong> (${userEmail})</div>
            <div style="margin-bottom: 12px;">Tárgy: <strong>${subject.trim()}</strong></div>
            <div style="white-space: pre-line;">${message.trim()}</div>
        </div>
    `;

    try {
        await sendMail({
            to: supportEmail,
            subject: mailSubject,
            text,
            html,
            from: userEmail,
            replyTo: userEmail
        });
        res.json({ message: 'Üzenet elküldve.' });
    } catch (err) {
        res.status(500).json({ message: 'Üzenet küldése sikertelen.', error: err.message });
    }
};
