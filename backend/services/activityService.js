const db = require('../config/db');

const logActivity = async ({ type, message, userId = null, tourId = null, bookingId = null }) => {
    if (!type || !message) return;
    await db.query(
        'INSERT INTO activity_log (type, message, user_id, tour_id, booking_id) VALUES (?, ?, ?, ?, ?)',
        [type, message, userId, tourId, bookingId]
    );
};

module.exports = { logActivity };
