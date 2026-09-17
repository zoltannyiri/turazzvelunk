const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendRegistrationEmail, sendAccountDeletedEmail, sendPasswordResetEmail } = require('../services/emailService');
const { logActivity } = require('../services/activityService');

exports.register = async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: "A név megadása kötelező!" });
    }
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const phoneDigits = normalizedPhone.replace(/\D/g, '');
    if (!normalizedPhone) {
        return res.status(400).json({ message: "A telefonszám megadása kötelező!" });
    }
    if (!/^\+?[\d\s()-]+$/.test(normalizedPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
        return res.status(400).json({ message: "Adj meg egy érvényes telefonszámot!" });
    }
    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) return res.status(400).json({ message: "Ez az email már foglalt!" });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await db.query('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, normalizedPhone]);
        const userId = result.insertId;

        try {
            await logActivity({
                type: 'user_registered',
                message: `Új regisztráció: ${name} (${email})`,
                userId
            });
        } catch (logErr) {
            console.error('Tevékenységnapló hiba:', logErr.message);
        }

        try {
            await sendRegistrationEmail({ to: email, name });
        } catch (emailErr) {
            console.error('Regisztracios email hiba:', emailErr.message);
        }

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
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.created_at, avatar_url: user.avatar_url }
        });
    } catch (err) {
        console.error("Login hiba:", err);
        res.status(500).json({ message: "Szerver hiba a bejelentkezéskor.", error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { email, currentPassword, newPassword, phone } = req.body;
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


        if (phone !== undefined) {
            const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
            if (trimmedPhone) {
                const phoneDigits = trimmedPhone.replace(/\D/g, '');
                if (!/^\+?[\d\s()-]+$/.test(trimmedPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
                    return res.status(400).json({ message: "Adj meg egy érvényes telefonszámot!" });
                }
            }
            updates.push('phone = ?');
            values.push(trimmedPhone || null);
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

        const [updatedRows] = await db.query('SELECT id, name, email, phone, role, created_at, avatar_url FROM users WHERE id = ?', [req.user.id]);
        res.json({ message: "Profil frissítve.", user: updatedRows[0] });
    } catch (err) {
        res.status(500).json({ message: "Szerver hiba történt a profil frissítésekor.", error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, phone, role, created_at, avatar_url FROM users ORDER BY created_at DESC'
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
            'SELECT id, name, email, phone, role, created_at, avatar_url FROM users WHERE id = ?',
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

exports.getPublicUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT id, name, created_at, avatar_url FROM users WHERE id = ?',
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

exports.getMe = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, phone, role, created_at, avatar_url FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMe = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        const user = rows[0];
        try {
            await logActivity({
                type: 'user_deleted',
                message: `Felhasználó törölte a fiókját: ${user.name} (${user.email})`,
                userId: user.id
            });
        } catch (logErr) {
            console.error('Tevékenységnapló hiba:', logErr.message);
        }
        await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);
        try {
            if (user.email) {
                await sendAccountDeletedEmail({ to: user.email, name: user.name });
            }
        } catch (emailErr) {
            console.error('Fiók törlés email hiba:', emailErr.message);
        }
        res.json({ message: 'Fiók törölve.' });
    } catch (err) {
        res.status(500).json({ message: 'Fiók törlése sikertelen.', error: err.message });
    }
};

exports.adminDeleteUser = async (req, res) => {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
        return res.status(400).json({ message: 'Saját fiókot innen nem törölheted.' });
    }
    try {
        const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        const user = rows[0];
        try {
            await logActivity({
                type: 'user_deleted',
                message: `Admin törölte a fiókot: ${user.name} (${user.email})`,
                userId: user.id
            });
        } catch (logErr) {
            console.error('Tevékenységnapló hiba:', logErr.message);
        }
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        try {
            if (user.email) {
                await sendAccountDeletedEmail({ to: user.email, name: user.name });
            }
        } catch (emailErr) {
            console.error('Fiók törlés email hiba:', emailErr.message);
        }
        res.json({ message: 'Felhasználó törölve.' });
    } catch (err) {
        res.status(500).json({ message: 'Felhasználó törlése sikertelen.', error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Az email cím megadása kötelező.' });
    }
    try {
        // Always respond with success to prevent email enumeration
        const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            const user = users[0];
            // Delete any existing unused tokens for this user
            await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
            // Generate a secure random token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await db.query(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt]
            );
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
            try {
                await sendPasswordResetEmail({ to: email, name: user.name, resetUrl });
            } catch (emailErr) {
                console.error('Jelszó visszaállítás email hiba:', emailErr.message);
            }
        }
        // Always return 200 regardless of whether email exists
        res.json({ message: 'Ha az email cím szerepel rendszerünkben, hamarosan megkapod a visszaállítási linket.' });
    } catch (err) {
        console.error('Elfelejtett jelszó hiba:', err);
        res.status(500).json({ message: 'Szerver hiba történt.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ message: 'A token és az új jelszó megadása kötelező.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'A jelszónak legalább 6 karakter hosszúnak kell lennie.' });
    }
    try {
        const [rows] = await db.query(
            `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
             FROM password_reset_tokens prt
             WHERE prt.token = ?`,
            [token]
        );
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Érvénytelen vagy lejárt visszaállítási link.' });
        }
        const resetEntry = rows[0];
        if (resetEntry.used) {
            return res.status(400).json({ message: 'Ez a visszaállítási link már felhasználásra került.' });
        }
        if (new Date(resetEntry.expires_at) < new Date()) {
            return res.status(400).json({ message: 'A visszaállítási link lejárt. Kérj újat!' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetEntry.user_id]);
        await db.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetEntry.id]);
        res.json({ message: 'A jelszavad sikeresen megváltozott. Most bejelentkezhetsz.' });
    } catch (err) {
        console.error('Jelszó visszaállítás hiba:', err);
        res.status(500).json({ message: 'Szerver hiba történt.' });
    }
};
