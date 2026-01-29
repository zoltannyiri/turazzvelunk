const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'titkos_kulcs_123');
            req.user = decoded;
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