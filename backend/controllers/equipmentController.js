const db = require('../config/db');

exports.getAllEquipment = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, description, total_quantity, created_at FROM equipment ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEquipment = async (req, res) => {
  const { name, description, total_quantity } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'A név megadása kötelező.' });
  }
  try {
    await db.query(
      'INSERT INTO equipment (name, description, total_quantity) VALUES (?, ?, ?)',
      [name.trim(), description || null, Number(total_quantity || 0)]
    );
    res.status(201).json({ message: 'Eszköz létrehozva.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEquipment = async (req, res) => {
  const { id } = req.params;
  const { name, description, total_quantity } = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM equipment WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Eszköz nem található.' });
    }
    await db.query(
      'UPDATE equipment SET name = ?, description = ?, total_quantity = ? WHERE id = ?',
      [name?.trim() || '', description || null, Number(total_quantity || 0), id]
    );
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
    res.json({ message: 'Eszköz törölve.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
