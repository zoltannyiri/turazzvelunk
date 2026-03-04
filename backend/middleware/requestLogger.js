const db = require('../config/db');

const truncate = (value, maxLen) => {
    if (!value) return null;
    const str = String(value);
    return str.length > maxLen ? str.slice(0, maxLen) : str;
};

const requestLogger = (req, res, next) => {
    res.on('finish', async () => {
        try {
            const statusCode = res.statusCode || 200;
            if (statusCode < 400 || statusCode >= 500) return;
            if (req.originalUrl && (req.originalUrl.startsWith('/api/admin/errors') || req.originalUrl.startsWith('/api/errors/client'))) return;

            await db.query(
                `INSERT INTO error_logs
                    (level, message, method, path, status_code, user_id, ip, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'warn',
                    truncate(`HTTP ${statusCode}`, 2000),
                    truncate(req.method, 10),
                    truncate(req.originalUrl, 255),
                    statusCode,
                    req.user?.id || null,
                    truncate(req.ip, 64),
                    truncate(req.headers['user-agent'] || '', 255)
                ]
            );
        } catch (err) {
            console.error('Request log insert failed:', err.message);
        }
    });

    next();
};

module.exports = { requestLogger };
