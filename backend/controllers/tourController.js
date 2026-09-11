const db = require('../config/db');
const { expireStaleBookings } = require('../services/bookingExpirationService');

const normalizeEquipmentPrices = (equipmentPrices) => {
    if (!Array.isArray(equipmentPrices)) return [];
    const uniqueItems = new Map();
    equipmentPrices.forEach((item) => {
        const equipmentId = Number(item?.equipment_id);
        if (Number.isInteger(equipmentId) && equipmentId > 0) {
            uniqueItems.set(equipmentId, {
                equipment_id: equipmentId,
                price: Number(item?.price || 0)
            });
        }
    });
    return [...uniqueItems.values()];
};

const findEquipmentAssignmentConflicts = async ({ equipmentPrices, startDate, endDate, excludeTourId = null }) => {
    const equipmentIds = normalizeEquipmentPrices(equipmentPrices).map((item) => item.equipment_id);
    if (equipmentIds.length === 0) return [];
    if (!startDate || !endDate) {
        const error = new Error('Eszközök hozzárendeléséhez add meg a túra teljes időintervallumát.');
        error.statusCode = 400;
        throw error;
    }

    const excludeSql = excludeTourId ? 'AND t.id <> ?' : '';
    const params = [...equipmentIds, endDate, startDate];
    if (excludeTourId) params.push(Number(excludeTourId));
    const [rows] = await db.query(
        `SELECT DISTINCT tep.equipment_id, e.name AS equipment_name,
                t.id AS conflicting_tour_id, t.title AS conflicting_tour_title,
                t.start_date, t.end_date
         FROM tour_equipment_prices tep
         JOIN equipment e ON e.id = tep.equipment_id
         JOIN tours t ON t.id = tep.tour_id
         WHERE tep.equipment_id IN (${equipmentIds.map(() => '?').join(',')})
           AND t.start_date <= ?
           AND t.end_date >= ?
           ${excludeSql}
         ORDER BY e.name, t.start_date`,
        params
    );
    return rows;
};

const getEquipmentConflictMessage = (conflicts) => {
    const grouped = new Map();
    conflicts.forEach((conflict) => {
        const names = grouped.get(conflict.equipment_name) || [];
        names.push(conflict.conflicting_tour_title);
        grouped.set(conflict.equipment_name, names);
    });
    const details = [...grouped.entries()]
        .map(([equipmentName, tourNames]) => `${equipmentName} – ${[...new Set(tourNames)].join(', ')}`)
        .join('; ');
    return `Az időszakban már másik túrához rendelt eszköz nem csatolható: ${details}.`;
};

exports.getAllTours = async (req, res) => {
    try {
        await expireStaleBookings();
        const [rows] = await db.query(`
            SELECT t.id, t.title, t.location, t.price, t.duration, t.difficulty,
                   t.image_url, t.description, t.start_date, t.end_date,
                   t.max_participants, t.category, t.subcategory,
                   COALESCE(b.booked_count, 0) AS booked_count,
                   COALESCE(w.waitlist_count, 0) AS waitlist_count
            FROM tours t
            LEFT JOIN (
                SELECT tour_id, COUNT(*) AS booked_count
                FROM bookings
                WHERE status IN ('pending', 'confirmed')
                GROUP BY tour_id
            ) b ON b.tour_id = t.id
            LEFT JOIN (
                SELECT tour_id, COUNT(*) AS waitlist_count
                FROM bookings
                WHERE status = 'waitlist'
                GROUP BY tour_id
            ) w ON w.tour_id = t.id
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
        await expireStaleBookings();
        const [rows] = await db.query(`
            SELECT t.id, t.title, t.location, t.price, t.duration, t.difficulty,
            t.image_url, t.description, t.start_date, t.end_date,
            t.max_participants, t.category, t.subcategory,
            (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id AND status IN ('pending', 'confirmed')) as booked_count,
            (SELECT COUNT(*) FROM bookings WHERE tour_id = t.id AND status = 'waitlist') as waitlist_count
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

exports.getMyCreatedTours = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id AS tour_id, title, location, image_url, price,
                    start_date, end_date, category, subcategory
             FROM tours
             WHERE created_by = ?
             ORDER BY start_date DESC, id DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Szerver hiba történt a saját túrák lekérésekor." });
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
                    COALESCE(tp.price, tour_booked.booked_price, 0) AS price,
                    COALESCE(tour_booked.qty, 0) AS booked_quantity,
                    COALESCE(reserved.qty, 0) AS reserved_quantity
             FROM equipment e
             LEFT JOIN tour_equipment_prices tp
               ON tp.equipment_id = e.id AND tp.tour_id = ?
             LEFT JOIN (
               SELECT be.equipment_id, SUM(be.quantity) AS qty, MAX(be.price) AS booked_price
               FROM booking_equipments be
               JOIN bookings b ON b.id = be.booking_id
               WHERE b.tour_id = ? AND b.status IN ('pending', 'confirmed')
               GROUP BY be.equipment_id
             ) tour_booked ON tour_booked.equipment_id = e.id
             LEFT JOIN (
               SELECT be.equipment_id, SUM(be.quantity) AS qty
               FROM booking_equipments be
               JOIN bookings b ON b.id = be.booking_id
               JOIN tours t ON t.id = b.tour_id
               WHERE b.status IN ('pending', 'confirmed')
                 AND t.start_date <= ? AND t.end_date >= ?
               GROUP BY be.equipment_id
             ) reserved ON reserved.equipment_id = e.id
             WHERE tp.id IS NOT NULL OR COALESCE(tour_booked.qty, 0) > 0
             ORDER BY e.name ASC`,
            [tour.id, tour.id, tour.end_date, tour.start_date]
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
    const { title, location, description, price, duration, difficulty, category, subcategory, image_url, start_date, end_date, max_participants, equipment_prices } = req.body;
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
        const normalizedEquipmentPrices = normalizeEquipmentPrices(equipment_prices);
        const conflicts = await findEquipmentAssignmentConflicts({
            equipmentPrices: normalizedEquipmentPrices,
            startDate: start_date,
            endDate: end_date
        });
        if (conflicts.length > 0) {
            return res.status(409).json({
                message: getEquipmentConflictMessage(conflicts),
                conflicts
            });
        }

        const [result] = await db.query(
            'INSERT INTO tours (created_by, title, location, description, price, duration, difficulty, category, subcategory, image_url, start_date, end_date, max_participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, title, location, description, price, durationValue, difficulty, category, subcategory, image_url, start_date, end_date, max_participants]
        );

        const tourId = result.insertId;
        if (normalizedEquipmentPrices.length > 0) {
            await Promise.all(
                normalizedEquipmentPrices.map((item) => {
                    return db.query(
                        'INSERT INTO tour_equipment_prices (tour_id, equipment_id, price) VALUES (?, ?, ?)',
                        [tourId, item.equipment_id, Number(item.price || 0)]
                    );
                })
            );
        }
        res.status(201).json({ message: "Túra sikeresen létrehozva!" });
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
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
        const equipmentPrices = Array.isArray(updates.equipment_prices)
            ? normalizeEquipmentPrices(updates.equipment_prices)
            : null;
        if ("equipment_prices" in updates) {
            delete updates.equipment_prices;
        }
        const [currentTourRows] = await db.query(
            'SELECT id, start_date, end_date FROM tours WHERE id = ?',
            [id]
        );
        if (currentTourRows.length === 0) {
            return res.status(404).json({ message: 'Túra nem található.' });
        }
        const effectiveStartDate = updates.start_date ?? currentTourRows[0].start_date;
        const effectiveEndDate = updates.end_date ?? currentTourRows[0].end_date;
        let equipmentForConflictCheck = equipmentPrices;
        if (!equipmentForConflictCheck && ('start_date' in updates || 'end_date' in updates)) {
            const [currentEquipment] = await db.query(
                'SELECT equipment_id, price FROM tour_equipment_prices WHERE tour_id = ?',
                [id]
            );
            equipmentForConflictCheck = currentEquipment;
        }
        if (equipmentForConflictCheck) {
            const conflicts = await findEquipmentAssignmentConflicts({
                equipmentPrices: equipmentForConflictCheck,
                startDate: effectiveStartDate,
                endDate: effectiveEndDate,
                excludeTourId: id
            });
            if (conflicts.length > 0) {
                return res.status(409).json({
                    message: getEquipmentConflictMessage(conflicts),
                    conflicts
                });
            }
        }
        if (equipmentPrices) {
            const submittedEquipment = new Map(
                equipmentPrices
                    .map((item) => [Number(item?.equipment_id), item])
                    .filter(([equipmentId]) => Number.isFinite(equipmentId))
            );
            const [bookedEquipment] = await db.query(
                `SELECT be.equipment_id, e.name, SUM(be.quantity) AS booked_quantity,
                        COALESCE(MAX(tp.price), MAX(be.price), 0) AS protected_price
                 FROM booking_equipments be
                 JOIN bookings b ON b.id = be.booking_id
                 JOIN equipment e ON e.id = be.equipment_id
                 LEFT JOIN tour_equipment_prices tp
                   ON tp.tour_id = b.tour_id AND tp.equipment_id = be.equipment_id
                 WHERE b.tour_id = ? AND b.status IN ('pending', 'confirmed')
                 GROUP BY be.equipment_id, e.name`,
                [id]
            );
            const blockedRemovals = bookedEquipment.filter(
                (item) => !submittedEquipment.has(Number(item.equipment_id))
            );
            if (blockedRemovals.length > 0) {
                const equipmentNames = blockedRemovals.map((item) => item.name).join(', ');
                return res.status(409).json({
                    message: `Nem távolítható el, mert aktív foglalás tartozik hozzá: ${equipmentNames}.`
                });
            }
            const blockedPriceChanges = bookedEquipment.filter((item) => {
                const submitted = submittedEquipment.get(Number(item.equipment_id));
                return Number(submitted?.price || 0) !== Number(item.protected_price || 0);
            });
            if (blockedPriceChanges.length > 0) {
                const equipmentNames = blockedPriceChanges.map((item) => item.name).join(', ');
                return res.status(409).json({
                    message: `Nem módosítható az ára, mert aktív foglalás tartozik hozzá: ${equipmentNames}.`
                });
            }
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
        const io = req.app.get('io');
        if (io) {
            io.emit('equipment-availability-updated', { tourId: Number(id) });
        }
        res.json({ message: "Túra sikeresen frissítve!" });
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
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
    const { start_date, end_date, exclude_tour_id } = req.query;
    if (!start_date || !end_date) {
        return res.status(400).json({ message: 'Hiányzó dátum intervallum.' });
    }
    try {
        const excludedTourId = Number(exclude_tour_id) || 0;
        const [rows] = await db.query(
            `SELECT e.id, e.name, e.description, e.total_quantity,
                    COALESCE(reserved.qty, 0) AS reserved_quantity,
                    COALESCE(assigned.assigned_tour_count, 0) AS assigned_tour_count,
                    assigned.conflicting_tours
             FROM equipment e
             LEFT JOIN (
               SELECT be.equipment_id, SUM(be.quantity) AS qty
               FROM booking_equipments be
               JOIN bookings b ON b.id = be.booking_id
               JOIN tours t ON t.id = b.tour_id
               WHERE b.status IN ('pending', 'confirmed')
                 AND t.start_date <= ? AND t.end_date >= ?
               GROUP BY be.equipment_id
             ) reserved ON reserved.equipment_id = e.id
             LEFT JOIN (
               SELECT tep.equipment_id,
                      COUNT(DISTINCT t.id) AS assigned_tour_count,
                      GROUP_CONCAT(DISTINCT t.title ORDER BY t.start_date SEPARATOR ' | ') AS conflicting_tours
               FROM tour_equipment_prices tep
               JOIN tours t ON t.id = tep.tour_id
               WHERE t.start_date <= ? AND t.end_date >= ?
                 AND (? = 0 OR t.id <> ?)
               GROUP BY tep.equipment_id
             ) assigned ON assigned.equipment_id = e.id
             ORDER BY e.name ASC`,
            [end_date, start_date, end_date, start_date, excludedTourId, excludedTourId]
        );

        const data = rows.map((row) => ({
            ...row,
            is_assigned_elsewhere: Number(row.assigned_tour_count || 0) > 0,
            available_quantity: Number(row.assigned_tour_count || 0) > 0
                ? 0
                : Math.max(0, Number(row.total_quantity || 0) - Number(row.reserved_quantity || 0))
        }));

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
