const { sendAdminEmail } = require('../services/emailService');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const db = require('../config/db');

const normalizeRecipients = (recipients) => {
    if (!Array.isArray(recipients)) return [];
    return recipients
        .map((item) => String(item || '').trim())
        .filter((item) => item.length > 0);
};

exports.sendAdminEmail = async (req, res) => {
    const { recipients, subject, message } = req.body || {};
    const normalized = normalizeRecipients(recipients);

    if (!normalized.length) {
        return res.status(400).json({ message: 'Nincs megadott címzett.' });
    }
    if (!subject || !subject.trim()) {
        return res.status(400).json({ message: 'A tárgy kötelező.' });
    }
    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Az üzenet szövege kötelező.' });
    }

    const failures = [];
    let sent = 0;

    try {
        const [emailInsert] = await db.query(
            'INSERT INTO admin_emails (subject, message, created_by) VALUES (?, ?, ?)',
            [subject.trim(), message.trim(), req.user?.id || null]
        );
        const emailId = emailInsert.insertId;

        for (const email of normalized) {
            try {
                await sendAdminEmail({ to: email, subject: subject.trim(), message: message.trim() });
                await db.query(
                    'INSERT INTO admin_email_recipients (email_id, recipient_email, status, error_message, sent_at) VALUES (?, ?, ?, ?, ?)',
                    [emailId, email, 'sent', null, new Date()]
                );
                sent += 1;
            } catch (err) {
                await db.query(
                    'INSERT INTO admin_email_recipients (email_id, recipient_email, status, error_message, sent_at) VALUES (?, ?, ?, ?, ?)',
                    [emailId, email, 'failed', err.message, new Date()]
                );
                failures.push({ email, error: err.message });
            }
        }

        return res.json({
            message: 'Email küldés befejezve.',
            sent,
            failed: failures.length,
            failures
        });
    } catch (err) {
        return res.status(500).json({ message: 'Email küldés sikertelen.', error: err.message });
    }
};

exports.listSent = async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    try {
        const [emails] = await db.query(
            `SELECT ae.id, ae.subject, ae.message, ae.created_at, ae.created_by,
                    u.name AS admin_name
             FROM admin_emails ae
             LEFT JOIN users u ON u.id = ae.created_by
             ORDER BY ae.created_at DESC
             LIMIT ?`,
            [limit]
        );

        if (emails.length === 0) {
            return res.json([]);
        }

        const ids = emails.map((item) => item.id);
        const [recipients] = await db.query(
            `SELECT r.email_id, r.recipient_email, r.status, r.error_message, r.sent_at,
                    u.name AS recipient_name
             FROM admin_email_recipients r
             JOIN users u ON u.email = r.recipient_email
             WHERE r.email_id IN (${ids.map(() => '?').join(',')})
             ORDER BY r.sent_at DESC`,
            ids
        );

        const grouped = recipients.reduce((acc, row) => {
            if (!acc[row.email_id]) acc[row.email_id] = [];
            acc[row.email_id].push({
                email: row.recipient_email,
                name: row.recipient_name,
                status: row.status,
                error: row.error_message,
                sent_at: row.sent_at
            });
            return acc;
        }, {});

        const payload = emails.map((email) => ({
            id: email.id,
            subject: email.subject,
            message: email.message,
            created_at: email.created_at,
            admin_name: email.admin_name,
            recipients: grouped[email.id] || []
        }));

        return res.json(payload);
    } catch (err) {
        return res.status(500).json({ message: 'Nem sikerult betolteni az elkuldott emaileket.', error: err.message });
    }
};

exports.listInbox = async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const host = process.env.IMAP_HOST;
    const port = Number(process.env.IMAP_PORT || 993);
    const secure = String(process.env.IMAP_SECURE || 'true').toLowerCase() === 'true';
    const user = process.env.IMAP_USER;
    const pass = process.env.IMAP_PASS;

    if (!host || !user || !pass) {
        return res.status(400).json({ message: 'IMAP nincs beallitva. Ellenorizd az IMAP_* env valtozokat.' });
    }

    const client = new ImapFlow({
        host,
        port,
        secure,
        auth: { user, pass }
    });

    try {
        const [userRows] = await db.query('SELECT id, name, email FROM users');
        const userMap = new Map(
            userRows.map((row) => [String(row.email || '').toLowerCase(), { id: row.id, name: row.name, email: row.email }])
        );

        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        const messages = [];

        try {
            const total = client.mailbox.exists || 0;
            if (total > 0) {
                const start = Math.max(total - limit + 1, 1);
                const range = `${start}:${total}`;
                for await (const msg of client.fetch(range, { envelope: true, uid: true, source: true })) {
                    const from = msg.envelope?.from?.[0];
                    const address = (from?.address || '').toLowerCase();
                    if (!address || !userMap.has(address)) {
                        continue;
                    }
                    let bodyText = '';
                    try {
                        const parsed = await simpleParser(msg.source);
                        bodyText = parsed.text || parsed.textAsHtml || '';
                    } catch (parseErr) {
                        bodyText = '';
                    }
                    messages.push({
                        uid: msg.uid,
                        subject: msg.envelope?.subject || '',
                        date: msg.envelope?.date || null,
                        from: {
                            name: from?.name || '',
                            email: from?.address || ''
                        },
                        user: userMap.get(address),
                        text: bodyText
                    });
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();
        return res.json(messages.reverse());
    } catch (err) {
        try {
            await client.logout();
        } catch (logoutErr) {
            // ignore
        }
        return res.status(500).json({ message: 'Nem sikerult betolteni az bejovo emaileket.', error: err.message });
    }
};
