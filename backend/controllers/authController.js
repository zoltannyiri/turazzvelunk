const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) return res.status(400).json({ message: "Ez az email már foglalt!" });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword]);

        res.status(201).json({ message: "Sikeres regisztráció!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: "Hibás email vagy jelszó!" });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Hibás email vagy jelszó!" });
        }
        const jwtSecret = process.env.JWT_SECRET || 'titkos_kulcs_123';
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role }, 
            jwtSecret, 
            { expiresIn: '1d' }
        );
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at, avatar_url: user.avatar_url }
        });
    } catch (err) {
        console.error("Login hiba:", err);
        res.status(500).json({ message: "Szerver hiba a bejelentkezéskor.", error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Felhasználó nem található." });
        }
        const user = rows[0];

        const updates = [];
        const values = [];

        if (email && email !== user.email) {
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.user.id]);
            if (existing.length > 0) {
                return res.status(400).json({ message: "Ez az email már foglalt!" });
            }
            updates.push('email = ?');
            values.push(email);
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Add meg a jelenlegi jelszót." });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Hibás jelenlegi jelszó." });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (req.file) {
            updates.push('avatar_url = ?');
            values.push(`/uploads/avatars/${req.file.filename}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "Nincs módosítandó adat." });
        }

        values.push(req.user.id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updatedRows] = await db.query('SELECT id, name, email, role, created_at, avatar_url FROM users WHERE id = ?', [req.user.id]);
        res.json({ message: "Profil frissítve.", user: updatedRows[0] });
    } catch (err) {
        res.status(500).json({ message: "Szerver hiba történt a profil frissítésekor.", error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at, avatar_url FROM users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Érvénytelen szerepkör.' });
    }
    if (Number(id) === Number(req.user.id) && role !== 'admin') {
        return res.status(400).json({ message: 'Saját admin jogot nem vehetsz el.' });
    }
    try {
        const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'Szerepkör frissítve.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at, avatar_url FROM users WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};