const db = require('../config/db');

exports.listErrors = async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 300);
    const level = (req.query.level || '').trim();
    try {
        let query = `
            SELECT e.id, e.level, e.message, e.stack, e.method, e.path,
                   e.status_code, e.user_id, e.ip, e.user_agent, e.created_at,
                   u.name AS user_name, u.email AS user_email
            FROM error_logs e
            LEFT JOIN users u ON u.id = e.user_id
        `;
        const params = [];
        if (level) {
            query += ' WHERE e.level = ?';
            params.push(level);
        }
        query += ' ORDER BY e.created_at DESC LIMIT ?';
        params.push(limit);
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Nem sikerült betölteni a hibákat.', error: err.message });
    }
};

exports.logClientError = async (req, res) => {
    const { message, stack, url } = req.body || {};
    if (!message) {
        return res.status(400).json({ message: 'Hiányzik a hiba üzenet.' });
    }
    try {
        await db.query(
            `INSERT INTO error_logs
                (level, message, stack, method, path, status_code, user_id, ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'error',
                String(message).slice(0, 2000),
                stack ? String(stack).slice(0, 8000) : null,
                'CLIENT',
                url ? String(url).slice(0, 255) : null,
                0,
                req.user?.id || null,
                String(req.ip || '').slice(0, 64),
                String(req.headers['user-agent'] || '').slice(0, 255)
            ]
        );
        res.json({ message: 'Ok' });
    } catch (err) {
        res.status(500).json({ message: 'Nem sikerült menteni a hibát.', error: err.message });
    }
};
