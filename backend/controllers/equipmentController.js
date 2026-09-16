const db = require('../config/db');

const normalizePassengerTransport = (isPassengerTransport, seatsPerUnit) => {
  const enabled = isPassengerTransport === true || Number(isPassengerTransport) === 1;
  const seats = enabled ? Number(seatsPerUnit) : null;
  if (enabled && (!Number.isInteger(seats) || seats < 1)) {
    return { error: 'Utasszállító eszköznél a férőhelyek száma legalább 1 legyen.' };
  }
  return { enabled, seats };
};

exports.getAllEquipment = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, description, total_quantity,
              is_passenger_transport, seats_per_unit, created_at
       FROM equipment ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEquipment = async (req, res) => {
  const { name, description, total_quantity, is_passenger_transport, seats_per_unit } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'A név megadása kötelező.' });
  }
  const transport = normalizePassengerTransport(is_passenger_transport, seats_per_unit);
  if (transport.error) return res.status(400).json({ message: transport.error });
  try {
    await db.query(
      `INSERT INTO equipment
         (name, description, total_quantity, is_passenger_transport, seats_per_unit)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), description || null, Number(total_quantity || 0), transport.enabled ? 1 : 0, transport.seats]
    );
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment-availability-updated', {});
    }
    res.status(201).json({ message: 'Eszköz létrehozva.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEquipment = async (req, res) => {
  const { id } = req.params;
  const { name, description, total_quantity, is_passenger_transport, seats_per_unit } = req.body;
  const transport = normalizePassengerTransport(is_passenger_transport, seats_per_unit);
  if (transport.error) return res.status(400).json({ message: transport.error });
  try {
    const [rows] = await db.query('SELECT id FROM equipment WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Eszköz nem található.' });
    }
    const capacityPerAssignedUnit = transport.enabled ? transport.seats : 1;
    const [overbookedTours] = await db.query(
      `SELECT t.title, COALESCE(tp.quantity, 1) AS assigned_quantity,
              COALESCE(SUM(CASE WHEN b.status IN ('pending', 'confirmed') THEN be.quantity ELSE 0 END), 0) AS booked_quantity
       FROM tour_equipment_prices tp
       JOIN tours t ON t.id = tp.tour_id
       LEFT JOIN booking_equipments be ON be.equipment_id = tp.equipment_id
       LEFT JOIN bookings b ON b.id = be.booking_id AND b.tour_id = tp.tour_id
       WHERE tp.equipment_id = ?
       GROUP BY tp.tour_id, t.title, tp.quantity
       HAVING booked_quantity > assigned_quantity * ?`,
      [id, capacityPerAssignedUnit]
    );
    if (overbookedTours.length > 0) {
      return res.status(409).json({
        message: `A férőhely nem csökkenthető, mert aktív foglalások tartoznak hozzá: ${overbookedTours.map((tour) => tour.title).join(', ')}.`
      });
    }
    await db.query(
      `UPDATE equipment
       SET name = ?, description = ?, total_quantity = ?,
           is_passenger_transport = ?, seats_per_unit = ?
       WHERE id = ?`,
      [name?.trim() || '', description || null, Number(total_quantity || 0), transport.enabled ? 1 : 0, transport.seats, id]
    );
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment-availability-updated', {});
    }
    res.json({ message: 'Eszköz frissítve.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEquipment = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id FROM equipment WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Eszköz nem található.' });
    }
    await db.query('DELETE FROM equipment WHERE id = ?', [id]);
    const io = req.app.get('io');
    if (io) {
      io.emit('equipment-availability-updated', {});
    }
    res.json({ message: 'Eszköz törölve.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
