const db = require('../config/db');

exports.createBooking = async (req, res) => {
    const { tour_id } = req.body;
    const user_id = req.user.id;
    try {
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
            `SELECT bookings.id, bookings.status, bookings.booked_at, 
             tours.title, tours.location, tours.image_url, tours.price 
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
        await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
        res.json({ message: "A jelentkezést sikeresen visszavontad." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [allBookings] = await db.query(
            `SELECT 
                bookings.*, 
                tours.title, tours.location, tours.price, tours.description, tours.image_url, tours.duration, tours.difficulty,
                tours.start_date, tours.end_date,
                users.name as user_name, users.email 
             FROM bookings 
             JOIN tours ON bookings.tour_id = tours.id 
             JOIN users ON bookings.user_id = users.id
             ORDER BY bookings.booked_at DESC`
        );
        res.json(allBookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: "Státusz sikeresen frissítve!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};