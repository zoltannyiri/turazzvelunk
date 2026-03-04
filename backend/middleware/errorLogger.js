const db = require('../config/db');

const truncate = (value, maxLen) => {
    if (!value) return null;
    const str = String(value);
    return str.length > maxLen ? str.slice(0, maxLen) : str;
};

const errorLogger = async (err, req, res, next) => {
    try {
        const statusCode = err.statusCode || res.statusCode || 500;
        const payload = {
            level: err.level || 'error',
            message: truncate(err.message || 'Ismeretlen hiba', 2000),
            stack: truncate(err.stack || '', 8000),
            method: truncate(req.method, 10),
            path: truncate(req.originalUrl, 255),
            status_code: Number(statusCode) || 500,
            user_id: req.user?.id || null,
            ip: truncate(req.ip, 64),
            user_agent: truncate(req.headers['user-agent'] || '', 255)
        };

        await db.query(
            `INSERT INTO error_logs
                (level, message, stack, method, path, status_code, user_id, ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.level,
                payload.message,
                payload.stack,
                payload.method,
                payload.path,
                payload.status_code,
                payload.user_id,
                payload.ip,
                payload.user_agent
            ]
        );
    } catch (logErr) {
        console.error('Error log insert failed:', logErr.message);
    }

    if (res.headersSent) {
        return next(err);
    }
    res.status(err.statusCode || 500).json({
        message: err.publicMessage || 'Szerver hiba történt.'
    });
};

module.exports = { errorLogger };
