const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'titkos_kulcs_123');
            const [rows] = await db.query('SELECT id, role FROM users WHERE id = ?', [decoded.id]);
            if (rows.length === 0) {
                return res.status(401).json({ message: "A felhasználói fiók nem létezik." });
            }
            req.user = { ...decoded, role: rows[0].role };
            next();
        } catch (error) {
            res.status(401).json({ message: "Érvénytelen token!" });
        }
    } else {
        res.status(401).json({ message: "Nincs jogosultságod, nincs token!" });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Hozzáférés megtagadva!" });
    }
};

module.exports = { protect, adminOnly };