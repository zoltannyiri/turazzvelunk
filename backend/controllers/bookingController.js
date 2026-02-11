const db = require('../config/db');

exports.createBooking = async (req, res) => {
    const { tour_id } = req.body;
    const user_id = req.user.id;
    try {
        const [tourRows] = await db.query(
            'SELECT max_participants FROM tours WHERE id = ?',
            [tour_id]
        );
        if (tourRows.length === 0) {
            return res.status(404).json({ message: "Túra nem található." });
        }
        const maxParticipants = tourRows[0].max_participants;
        if (maxParticipants) {
            const [countRows] = await db.query(
                'SELECT COUNT(*) AS bookedCount FROM bookings WHERE tour_id = ? AND status <> ?',
                [tour_id, 'cancelled']
            );
            const bookedCount = countRows[0]?.bookedCount || 0;
            if (bookedCount >= maxParticipants) {
                return res.status(400).json({ message: "A túra betelt." });
            }
        }
        const [existing] = await db.query(
            'SELECT * FROM bookings WHERE user_id = ? AND tour_id = ?', 
            [user_id, tour_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Erre a túrára már jelentkeztél!" });
        }
        await db.query(
            'INSERT INTO bookings (user_id, tour_id) VALUES (?, ?)', 
            [user_id, tour_id]
        );
        res.status(201).json({ message: "Sikeres jelentkezés a túrára!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMyBookings = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [myBookings] = await db.query(
            `SELECT bookings.id, bookings.status, bookings.booked_at, bookings.payment_status, bookings.paid_at,
                         tours.id AS tour_id, tours.title, tours.location, tours.image_url, tours.price,
                         (
                             SELECT r.status FROM booking_cancel_requests r
                             WHERE r.booking_id = bookings.id
                             ORDER BY r.created_at DESC
                             LIMIT 1
                         ) AS cancel_request_status
             FROM bookings 
             JOIN tours ON bookings.tour_id = tours.id 
             WHERE bookings.user_id = ?`, 
            [user_id]
        );

        res.json(myBookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBooking = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    try {
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );
        if (booking.length === 0) {
            return res.status(404).json({ message: "Foglalás nem található, vagy nincs hozzá jogosultságod." });
        }
        if (booking[0].status === 'confirmed') {
            return res.status(400).json({ message: "Az elfogadott jelentkezést csak lejelentkezési kérelemmel lehet visszavonni." });
        }
        await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
        const io = req.app.get('io');
        if (io) {
            io.to(`tour:${booking[0].tour_id}`).emit('tour-chat-membership', {
                tourId: booking[0].tour_id,
                userId: userId,
                status: 'removed'
            });
        }
        res.json({ message: "A jelentkezést sikeresen visszavontad." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                b.*, 
                t.title, t.location, t.price, t.description, t.image_url, 
                t.duration, t.difficulty, t.difficulty_level, t.category, t.subcategory, t.start_date, t.end_date,
                t.max_participants,
                u.name AS user_name, u.email 
            FROM bookings b
            JOIN tours t ON b.tour_id = t.id
            JOIN users u ON b.user_id = u.id
            ORDER BY b.booked_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const [rows] = await db.query('SELECT tour_id, user_id FROM bookings WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Foglalás nem található." });
        }
        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        const io = req.app.get('io');
        if (io) {
            io.to(`tour:${rows[0].tour_id}`).emit('tour-chat-membership', {
                tourId: rows[0].tour_id,
                userId: rows[0].user_id,
                status: status === 'confirmed' ? 'confirmed' : 'removed'
            });
        }
        res.json({ message: "Státusz sikeresen frissítve!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeBookingByTourId = async (req, res) => {
    try {
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE user_id = ? AND tour_id = ?',
            [req.user.id, req.params.tourId]
        );
        if (booking.length === 0) {
            return res.status(404).json({ message: "Foglalás nem található." });
        }
        if (booking[0].status === 'confirmed') {
            return res.status(400).json({ message: "Az elfogadott jelentkezést csak lejelentkezési kérelemmel lehet visszavonni." });
        }
        await db.query('DELETE FROM bookings WHERE user_id = ? AND tour_id = ?', [req.user.id, req.params.tourId]);
        const io = req.app.get('io');
        if (io) {
            io.to(`tour:${req.params.tourId}`).emit('tour-chat-membership', {
                tourId: Number(req.params.tourId),
                userId: req.user.id,
                status: 'removed'
            });
        }
        res.json({ message: "Sikeresen lejelentkeztél a túráról!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.checkIfBooked = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id FROM bookings WHERE user_id = ? AND tour_id = ?',
            [req.user.id, req.params.tourId]
        );
        res.json({ isBooked: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookingStatusByTourId = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT b.id, b.status,
                (
                  SELECT r.status FROM booking_cancel_requests r
                  WHERE r.booking_id = b.id
                  ORDER BY r.created_at DESC
                  LIMIT 1
                ) AS cancel_request_status
             FROM bookings b
             WHERE b.user_id = ? AND b.tour_id = ?`,
            [req.user.id, req.params.tourId]
        );
        if (rows.length === 0) {
            return res.json({ isBooked: false });
        }
        res.json({
            isBooked: true,
            bookingId: rows[0].id,
            status: rows[0].status,
            cancel_request_status: rows[0].cancel_request_status || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTourParticipants = async (req, res) => {
    const { tourId } = req.params;
    try {
        const [allowedRows] = await db.query(
            'SELECT id FROM bookings WHERE tour_id = ? AND user_id = ? AND status = ?',
            [tourId, req.user.id, 'confirmed']
        );
        if (req.user?.role !== 'admin' && allowedRows.length === 0) {
            return res.status(403).json({ message: 'Nincs jogosultság.' });
        }

        const [rows] = await db.query(
            `SELECT b.user_id, u.name AS user_name, u.avatar_url
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.tour_id = ? AND b.status = ?
             ORDER BY u.name ASC`,
            [tourId, 'confirmed']
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCancellationRequest = async (req, res) => {
    const { reason } = req.body;
    const bookingId = req.params.id;
    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Add meg a lejelentkezés okát." });
    }
    try {
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, req.user.id]
        );
        if (booking.length === 0) {
            return res.status(404).json({ message: "Foglalás nem található." });
        }
        if (booking[0].status !== 'confirmed') {
            return res.status(400).json({ message: "Csak elfogadott jelentkezéshez lehet kérelmet leadni." });
        }
        await db.query(
            'INSERT INTO booking_cancel_requests (booking_id, user_id, reason) VALUES (?, ?, ?)',
            [bookingId, req.user.id, reason.trim()]
        );
        res.status(201).json({ message: "Lejelentkezési kérelem elküldve." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCancellationRequests = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.id, r.booking_id, r.user_id, r.reason, r.status, r.created_at,
                    b.tour_id, b.status AS booking_status,
                    t.title AS tour_title, t.location,
                    u.name AS user_name, u.email
             FROM booking_cancel_requests r
             JOIN bookings b ON r.booking_id = b.id
             JOIN tours t ON b.tour_id = t.id
             JOIN users u ON r.user_id = u.id
             ORDER BY r.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCancellationRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Érvénytelen státusz." });
    }
    try {
        const [rows] = await db.query('SELECT booking_id FROM booking_cancel_requests WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Kérelem nem található." });
        }
        await db.query(
            'UPDATE booking_cancel_requests SET status = ?, processed_at = NOW(), admin_id = ? WHERE id = ?',
            [status, req.user.id, id]
        );
        if (status === 'approved') {
            await db.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', rows[0].booking_id]);
            const [bookingRows] = await db.query('SELECT tour_id, user_id FROM bookings WHERE id = ?', [rows[0].booking_id]);
            const io = req.app.get('io');
            if (io && bookingRows.length > 0) {
                io.to(`tour:${bookingRows[0].tour_id}`).emit('tour-chat-membership', {
                    tourId: bookingRows[0].tour_id,
                    userId: bookingRows[0].user_id,
                    status: 'removed'
                });
            }
        }
        res.json({ message: "Kérelem frissítve." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.adminDeleteBooking = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT id, tour_id, user_id FROM bookings WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Foglalás nem található." });
        }
        await db.query('DELETE FROM booking_cancel_requests WHERE booking_id = ?', [id]);
        await db.query('DELETE FROM bookings WHERE id = ?', [id]);
        const io = req.app.get('io');
        if (io) {
            io.to(`tour:${rows[0].tour_id}`).emit('tour-chat-membership', {
                tourId: rows[0].tour_id,
                userId: rows[0].user_id,
                status: 'removed'
            });
        }
        res.json({ message: "Foglalás törölve." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookingsByTourId = async (req, res) => {
    const { tourId } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT b.id, b.status, b.booked_at, b.user_id,
                    u.name AS user_name, u.email
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.tour_id = ?
             ORDER BY b.booked_at DESC`,
            [tourId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookingsByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT b.id, b.status, b.booked_at, b.tour_id,
                    t.title, t.location, t.start_date, t.end_date
             FROM bookings b
             JOIN tours t ON b.tour_id = t.id
             WHERE b.user_id = ?
             ORDER BY b.booked_at DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};