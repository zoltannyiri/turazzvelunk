const db = require('../config/db');

const isChatAllowed = async (tourId, user) => {
    if (user?.role === 'admin') {
        return true;
    }
    const [rows] = await db.query(
        'SELECT id FROM bookings WHERE tour_id = ? AND user_id = ? AND status = ?',
        [tourId, user.id, 'confirmed']
    );
    return rows.length > 0;
};

exports.getChatMessages = async (req, res) => {
    const { id: tourId } = req.params;
    try {
        const allowed = await isChatAllowed(tourId, req.user);
        if (!allowed) {
            return res.status(403).json({ message: 'Nincs jogosultság a csevegéshez.' });
        }

        const [rows] = await db.query(
            `SELECT m.id, m.tour_id, m.user_id, m.message, m.created_at,
                    u.name AS user_name, u.avatar_url AS avatarUrl
             FROM tour_chat_messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.tour_id = ?
             ORDER BY m.created_at ASC`,
            [tourId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createChatMessage = async (req, res) => {
    const { id: tourId } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Üzenet nem lehet üres.' });
    }

    try {
        const allowed = await isChatAllowed(tourId, req.user);
        if (!allowed) {
            return res.status(403).json({ message: 'Nincs jogosultság a csevegéshez.' });
        }

        const [userRows] = await db.query(
            'SELECT name, avatar_url FROM users WHERE id = ?',
            [req.user.id]
        );
        const cleanMessage = message.trim();
        const [result] = await db.query(
            'INSERT INTO tour_chat_messages (tour_id, user_id, message) VALUES (?, ?, ?)',
            [tourId, req.user.id, cleanMessage]
        );

        const payload = {
            id: result.insertId,
            tour_id: Number(tourId),
            user_id: req.user.id,
            user_name: userRows[0]?.name || req.user.name,
            avatarUrl: userRows[0]?.avatar_url || null,
            message: cleanMessage,
            created_at: new Date().toISOString()
        };

        const io = req.app.get('io');
        if (io) {
            io.to(`tour:${tourId}`).emit('tour-chat-message', payload);
        }

        res.status(201).json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
