const db = require('../config/db');

exports.getAllTours = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tours');
        console.log("Adatok lekérve:", rows.length, "db túra");
        res.json(rows);
    } catch (err) {
        console.error("SQL HIBA (getAllTours):", err.message);
        res.status(500).json({ error: "Szerver hiba történt a lekéréskor." });
    }
};

exports.getTourById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, 
            (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id) as booked_count 
            FROM tours t 
            WHERE t.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Túra nem található" });
        }
        console.log("Egyedi túra lekérve:", rows[0].title);
        res.json(rows[0]);
    } catch (err) {
        console.error("SQL HIBA (getTourById):", err.message);
        res.status(500).json({ error: "Szerver hiba történt a lekéréskor." });
    }
};

exports.createTour = async (req, res) => {
    const { title, location, description, price, duration, difficulty, image_url, start_date, end_date, max_participants } = req.body;
    const durationValue = duration === "" || duration === null || duration === undefined ? null : Number(duration);
    try {
        await db.query(
            'INSERT INTO tours (title, location, description, price, duration, difficulty, image_url, start_date, end_date, max_participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, location, description, price, durationValue, difficulty, image_url, start_date, end_date, max_participants]
        );
        res.status(201).json({ message: "Túra sikeresen létrehozva!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTour = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Nincs módosítandó adat!" });
    }
    try {
        if ("duration" in updates) {
            let d = updates.duration;
            d = (d === "" || d === null || d === undefined) ? null : Number(d);
            updates.duration = (d !== null && Number.isFinite(d)) ? d : null;
            }
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);
        const sql = `UPDATE tours SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);
        res.json({ message: "Túra sikeresen frissítve!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTour = async (req, res) => {
    const { id } = req.params;
    try {
        const [bookings] = await db.query('SELECT * FROM bookings WHERE tour_id = ?', [id]);
        if (bookings.length > 0) {
            return res.status(400).json({ message: "Nem törölhető! Erre a túrára már vannak jelentkezők." });
        }
        await db.query('DELETE FROM tours WHERE id = ?', [id]);
        res.json({ message: "Túra sikeresen törölve!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};