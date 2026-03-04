const db = require('../config/db');

exports.listActivity = async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 300);
    try {
        const [rows] = await db.query(
            `SELECT a.id, a.type, a.message, a.created_at,
                    a.user_id, a.tour_id,
                    u.name AS user_name, u.email AS user_email,
                    t.title AS tour_title
             FROM activity_log a
             LEFT JOIN users u ON u.id = a.user_id
             LEFT JOIN tours t ON t.id = a.tour_id
             ORDER BY a.created_at DESC
             LIMIT ?`,
            [limit]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Nem sikerult betolteni a tevekenysegnaplot.', error: err.message });
    }
};
