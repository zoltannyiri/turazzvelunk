const db = require('../config/db');

exports.getAllTours = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, COALESCE(b.booked_count, 0) AS booked_count
            FROM tours t
            LEFT JOIN (
                SELECT tour_id, COUNT(*) AS booked_count
                FROM bookings
                WHERE status <> 'cancelled'
                GROUP BY tour_id
            ) b ON b.tour_id = t.id
        `);
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
            (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id AND status <> 'cancelled') as booked_count 
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

exports.getTourEquipmentOptions = async (req, res) => {
    const { id } = req.params;
    try {
        const [tourRows] = await db.query('SELECT id, start_date, end_date FROM tours WHERE id = ?', [id]);
        if (tourRows.length === 0) {
            return res.status(404).json({ message: "Túra nem található" });
        }

        const tour = tourRows[0];
        const [rows] = await db.query(
            `SELECT e.id, e.name, e.description, e.total_quantity,
                    COALESCE(tp.price, 0) AS price,
                    COALESCE(reserved.qty, 0) AS reserved_quantity
             FROM equipment e
             LEFT JOIN tour_equipment_prices tp
               ON tp.equipment_id = e.id AND tp.tour_id = ?
             LEFT JOIN (
               SELECT be.equipment_id, SUM(be.quantity) AS qty
               FROM booking_equipments be
               JOIN bookings b ON b.id = be.booking_id
               JOIN tours t ON t.id = b.tour_id
               WHERE b.status <> 'cancelled'
                 AND t.start_date <= ? AND t.end_date >= ?
               GROUP BY be.equipment_id
             ) reserved ON reserved.equipment_id = e.id
             ORDER BY e.name ASC`,
            [tour.id, tour.end_date, tour.start_date]
        );

        const data = rows.map((row) => ({
            ...row,
            available_quantity: Math.max(0, Number(row.total_quantity || 0) - Number(row.reserved_quantity || 0))
        }));

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTour = async (req, res) => {
    const { title, location, description, price, duration, difficulty, difficulty_level, category, subcategory, image_url, start_date, end_date, max_participants, equipment_prices } = req.body;
    const durationValue = duration === "" || duration === null || duration === undefined ? null : Number(duration);
    if (start_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(start_date);
        startDate.setHours(0, 0, 0, 0);
        if (startDate < today) {
            return res.status(400).json({ message: "A túra kezdete nem lehet korábbi a mai dátumnál." });
        }
    }
    try {
        const [result] = await db.query(
            'INSERT INTO tours (title, location, description, price, duration, difficulty, difficulty_level, category, subcategory, image_url, start_date, end_date, max_participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, location, description, price, durationValue, difficulty, difficulty_level, category, subcategory, image_url, start_date, end_date, max_participants]
        );

        const tourId = result.insertId;
        if (Array.isArray(equipment_prices) && equipment_prices.length > 0) {
            await Promise.all(
                equipment_prices.map((item) => {
                    if (!item?.equipment_id) return Promise.resolve();
                    return db.query(
                        'INSERT INTO tour_equipment_prices (tour_id, equipment_id, price) VALUES (?, ?, ?)',
                        [tourId, item.equipment_id, Number(item.price || 0)]
                    );
                })
            );
        }
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
        if (updates.start_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(updates.start_date);
            startDate.setHours(0, 0, 0, 0);
            if (startDate < today) {
                return res.status(400).json({ message: "A túra kezdete nem lehet korábbi a mai dátumnál." });
            }
        }
        if ("duration" in updates) {
            let d = updates.duration;
            d = (d === "" || d === null || d === undefined) ? null : Number(d);
            updates.duration = (d !== null && Number.isFinite(d)) ? d : null;
            }
        if ("difficulty_level" in updates) {
            const lvl = Number(updates.difficulty_level);
            updates.difficulty_level = Number.isFinite(lvl) ? lvl : null;
        }
        const equipmentPrices = Array.isArray(updates.equipment_prices) ? updates.equipment_prices : null;
        if ("equipment_prices" in updates) {
            delete updates.equipment_prices;
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
        if (equipmentPrices) {
            await db.query('DELETE FROM tour_equipment_prices WHERE tour_id = ?', [id]);
            await Promise.all(
                equipmentPrices.map((item) => {
                    if (!item?.equipment_id) return Promise.resolve();
                    return db.query(
                        'INSERT INTO tour_equipment_prices (tour_id, equipment_id, price) VALUES (?, ?, ?)',
                        [id, item.equipment_id, Number(item.price || 0)]
                    );
                })
            );
        }
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

exports.getEquipmentAvailabilityByRange = async (req, res) => {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
        return res.status(400).json({ message: 'Hiányzó dátum intervallum.' });
    }
    try {
        const [rows] = await db.query(
            `SELECT e.id, e.name, e.description, e.total_quantity,
                    COALESCE(reserved.qty, 0) AS reserved_quantity
             FROM equipment e
             LEFT JOIN (
               SELECT be.equipment_id, SUM(be.quantity) AS qty
               FROM booking_equipments be
               JOIN bookings b ON b.id = be.booking_id
               JOIN tours t ON t.id = b.tour_id
               WHERE b.status <> 'cancelled'
                 AND t.start_date <= ? AND t.end_date >= ?
               GROUP BY be.equipment_id
             ) reserved ON reserved.equipment_id = e.id
             ORDER BY e.name ASC`,
            [end_date, start_date]
        );

        const data = rows.map((row) => ({
            ...row,
            available_quantity: Math.max(0, Number(row.total_quantity || 0) - Number(row.reserved_quantity || 0))
        }));

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};