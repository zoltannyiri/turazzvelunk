const db = require('../config/db');

exports.getMyNotifications = async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 100);
  try {
    const [notifications] = await db.query(
      `SELECT id, type, title, message, link, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [req.user.id, limit]
    );
    const [countRows] = await db.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ notifications, unread_count: Number(countRows[0]?.unread_count || 0) });
  } catch (err) {
    res.status(500).json({ message: 'Nem sikerült betölteni az értesítéseket.', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Az értesítés nem található.' });
    }
    res.json({ message: 'Az értesítés olvasottra jelölve.' });
  } catch (err) {
    res.status(500).json({ message: 'Nem sikerült frissíteni az értesítést.', error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ message: 'Minden értesítés olvasottra jelölve.' });
  } catch (err) {
    res.status(500).json({ message: 'Nem sikerült frissíteni az értesítéseket.', error: err.message });
  }
};
