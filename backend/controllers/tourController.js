const db = require('../config/db');
const { expireStaleBookings } = require('../services/bookingExpirationService');

const normalizeEquipmentPrices = (equipmentPrices) => {
    if (!Array.isArray(equipmentPrices)) return [];
    const uniqueItems = new Map();
    equipmentPrices.forEach((item) => {
        const equipmentId = Number(item?.equipment_id);
        if (Number.isInteger(equipmentId) && equipmentId > 0) {
            const qty = Number(item?.quantity);
            uniqueItems.set(equipmentId, {
                equipment_id: equipmentId,
                price: Number(item?.price || 0),
                quantity: Number.isInteger(qty) && qty > 0 ? qty : 1
            });
        }
    });
    return [...uniqueItems.values()];
};

const findEquipmentAssignmentConflicts = async ({ equipmentPrices, startDate, endDate, excludeTourId = null }) => {
    const normalized = normalizeEquipmentPrices(equipmentPrices);
    if (normalized.length === 0) return [];
    if (!startDate || !endDate) {
        const error = new Error('Eszközök hozzárendeléséhez add meg a túra teljes időintervallumát.');
        error.statusCode = 400;
        throw error;
    }

    const equipmentIds = normalized.map((item) => item.equipment_id);
    const excludeSql = excludeTourId ? 'AND t.id <> ?' : '';
    const params = [endDate, startDate];
    if (excludeTourId) params.push(Number(excludeTourId));

    const [rows] = await db.query(
        `SELECT e.id AS equipment_id, e.name AS equipment_name, e.total_quantity,
                COALESCE(other_tours.assigned_qty, 0) AS other_assigned_qty,
                other_tours.conflicting_tours
         FROM equipment e
         LEFT JOIN (
            SELECT tep.equipment_id,
                   SUM(COALESCE(tep.quantity, 1)) AS assigned_qty,
                   GROUP_CONCAT(DISTINCT t.title ORDER BY t.start_date SEPARATOR ' | ') AS conflicting_tours
            FROM tour_equipment_prices tep
            JOIN tours t ON t.id = tep.tour_id
            WHERE t.start_date <= ? AND t.end_date >= ?
              ${excludeSql}
            GROUP BY tep.equipment_id
         ) other_tours ON other_tours.equipment_id = e.id
         WHERE e.id IN (${equipmentIds.map(() => '?').join(',')})`,
        [...params, ...equipmentIds]
    );

    const conflicts = [];
    const rowMap = new Map(rows.map((r) => [Number(r.equipment_id), r]));

    for (const item of normalized) {
        const eqInfo = rowMap.get(item.equipment_id);
        if (!eqInfo) continue;
        const total = Number(eqInfo.total_quantity || 0);
        const otherAssigned = Number(eqInfo.other_assigned_qty || 0);
        const available = Math.max(0, total - otherAssigned);
        if (item.quantity > available) {
            conflicts.push({
                equipment_id: item.equipment_id,
                equipment_name: eqInfo.equipment_name,
                requested_quantity: item.quantity,
                available_quantity: available,
                total_quantity: total,
                conflicting_tours: eqInfo.conflicting_tours || ''
            });
        }
    }

    return conflicts;
};

const getEquipmentConflictMessage = (conflicts) => {
    const details = conflicts
        .map((c) => c.equipment_name + ' (Kért: ' + c.requested_quantity + ' db, Szabad készlet: ' + c.available_quantity + ' db)')
        .join('; ');
    return 'Az időszakban a megadott darabszám meghaladja a szabad készletet: ' + details + '.';
};

exports.getAllTours = async (req, res) => {
    try {
        await expireStaleBookings();
        const [rows] = await db.query(`
            SELECT t.id, t.title, t.location, t.price, t.duration, t.difficulty,
                   t.image_url, t.description, t.start_date, t.end_date,
                   t.max_participants, t.category, t.subcategory,
                   t.deposit_amount, t.deposit_deadline,
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
            t.deposit_amount, t.deposit_deadline,
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
                    COALESCE(tp.quantity, e.total_quantity) AS assigned_quantity,
                    COALESCE(tour_booked.qty, 0) AS booked_quantity
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
             WHERE tp.id IS NOT NULL OR COALESCE(tour_booked.qty, 0) > 0
             ORDER BY e.name ASC`,
            [tour.id, tour.id]
        );

        const data = rows.map((row) => {
            const assigned = Number(row.assigned_quantity || 0);
            const booked = Number(row.booked_quantity || 0);
            return {
                ...row,
                assigned_quantity: assigned,
                booked_quantity: booked,
                available_quantity: Math.max(0, assigned - booked)
            };
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTour = async (req, res) => {
    const { title, location, description, price, duration, difficulty, category, subcategory, image_url, start_date, end_date, max_participants, equipment_prices, deposit_amount, deposit_deadline } = req.body;
    const durationValue = duration === "" || duration === null || duration === undefined ? null : Number(duration);
    const depositAmountValue = deposit_amount !== null && deposit_amount !== undefined && deposit_amount !== '' ? Number(deposit_amount) : null;
    const depositDeadlineValue = deposit_deadline || null;
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
            'INSERT INTO tours (created_by, title, location, description, price, duration, difficulty, category, subcategory, image_url, start_date, end_date, max_participants, deposit_amount, deposit_deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, title, location, description, price, durationValue, difficulty, category, subcategory, image_url, start_date, end_date, max_participants, depositAmountValue, depositDeadlineValue]
        );

        const tourId = result.insertId;
        if (normalizedEquipmentPrices.length > 0) {
            await Promise.all(
                normalizedEquipmentPrices.map((item) => {
                    return db.query(
                        'INSERT INTO tour_equipment_prices (tour_id, equipment_id, price, quantity) VALUES (?, ?, ?, ?)',
                        [tourId, item.equipment_id, Number(item.price || 0), Number(item.quantity || 1)]
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
            const blockedQuantityReductions = bookedEquipment.filter((item) => {
                const submitted = submittedEquipment.get(Number(item.equipment_id));
                return submitted && Number(submitted.quantity || 1) < Number(item.booked_quantity || 0);
            });
            if (blockedQuantityReductions.length > 0) {
                const details = blockedQuantityReductions
                    .map((item) => `${item.name} (lefoglalva: ${item.booked_quantity} db)`)
                    .join(', ');
                return res.status(409).json({
                    message: `Nem csökkenthető a darabszám a már lefoglalt mennyiség alá: ${details}.`
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
                        'INSERT INTO tour_equipment_prices (tour_id, equipment_id, price, quantity) VALUES (?, ?, ?, ?)',
                        [id, item.equipment_id, Number(item.price || 0), Number(item.quantity || 1)]
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
                    COALESCE(other_tours.assigned_qty, 0) AS other_assigned_quantity,
                    COALESCE(this_tour.assigned_qty, 0) AS current_assigned_quantity,
                    COALESCE(this_tour_booked.qty, 0) AS current_booked_quantity,
                    other_tours.conflicting_tours
             FROM equipment e
             LEFT JOIN (
               SELECT tep.equipment_id,
                      SUM(COALESCE(tep.quantity, 1)) AS assigned_qty,
                      GROUP_CONCAT(DISTINCT t.title ORDER BY t.start_date SEPARATOR ' | ') AS conflicting_tours
               FROM tour_equipment_prices tep
               JOIN tours t ON t.id = tep.tour_id
               WHERE t.start_date <= ? AND t.end_date >= ?
                 AND (? = 0 OR t.id <> ?)
               GROUP BY tep.equipment_id
             ) other_tours ON other_tours.equipment_id = e.id
             LEFT JOIN (
               SELECT tep.equipment_id, COALESCE(tep.quantity, 1) AS assigned_qty
               FROM tour_equipment_prices tep
               WHERE tep.tour_id = ?
             ) this_tour ON this_tour.equipment_id = e.id
             LEFT JOIN (
               SELECT be.equipment_id, SUM(be.quantity) AS qty
               FROM booking_equipments be
               JOIN bookings b ON b.id = be.booking_id
               WHERE b.tour_id = ? AND b.status IN ('pending', 'confirmed')
               GROUP BY be.equipment_id
             ) this_tour_booked ON this_tour_booked.equipment_id = e.id
             ORDER BY e.name ASC`,
            [end_date, start_date, excludedTourId, excludedTourId, excludedTourId, excludedTourId]
        );

        const data = rows.map((row) => {
            const total = Number(row.total_quantity || 0);
            const otherAssigned = Number(row.other_assigned_quantity || 0);
            const availableForThisTour = Math.max(0, total - otherAssigned);
            const currentAssigned = Number(row.current_assigned_quantity || 0);
            const booked = Number(row.current_booked_quantity || 0);
            const minAllowed = Math.max(1, booked);

            return {
                id: row.id,
                name: row.name,
                description: row.description,
                total_quantity: total,
                other_assigned_quantity: otherAssigned,
                current_assigned_quantity: currentAssigned,
                current_booked_quantity: booked,
                min_quantity: minAllowed,
                available_quantity: availableForThisTour,
                conflicting_tours: row.conflicting_tours || null
            };
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
