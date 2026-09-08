const db = require('../config/db');

const APP_TIME_ZONE = 'Europe/Budapest';
const MIDNIGHT_SAFETY_DELAY_MS = 2000;
const zonedDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});

let lastSyncDateKey = null;
let activeSync = null;

const getZonedParts = (date = new Date()) => Object.fromEntries(
    zonedDateTimeFormatter
        .formatToParts(date)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)])
);

const getBudapestDateKey = (date = new Date()) => {
    const { year, month, day } = getZonedParts(date);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const getTimeZoneOffsetMs = (date) => {
    const { year, month, day, hour, minute, second } = getZonedParts(date);
    const zonedAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    const dateWithoutMilliseconds = Math.floor(date.getTime() / 1000) * 1000;
    return zonedAsUtc - dateWithoutMilliseconds;
};

const zonedMidnightToUtc = (year, month, day) => {
    const desiredAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
    let result = desiredAsUtc - getTimeZoneOffsetMs(new Date(desiredAsUtc));
    result = desiredAsUtc - getTimeZoneOffsetMs(new Date(result));
    return result;
};

const getMillisecondsUntilNextBudapestMidnight = (now = new Date()) => {
    const { year, month, day } = getZonedParts(now);
    const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
    const nextMidnight = zonedMidnightToUtc(
        tomorrow.getUTCFullYear(),
        tomorrow.getUTCMonth() + 1,
        tomorrow.getUTCDate()
    );
    return Math.max(1000, nextMidnight - now.getTime() + MIDNIGHT_SAFETY_DELAY_MS);
};

const expireStaleBookings = async ({ force = false } = {}) => {
    const currentDateKey = getBudapestDateKey();
    if (!force && lastSyncDateKey === currentDateKey) return 0;
    if (activeSync) return activeSync;

    activeSync = (async () => {
        const [result] = await db.query(
            `UPDATE bookings b
             JOIN tours t ON t.id = b.tour_id
             SET b.status = 'expired'
             WHERE b.status IN ('pending', 'waitlist')
               AND t.start_date IS NOT NULL
               AND t.start_date <= ?`,
            [currentDateKey]
        );
        lastSyncDateKey = currentDateKey;
        return Number(result.affectedRows || 0);
    })();

    try {
        return await activeSync;
    } finally {
        activeSync = null;
    }
};

const startBookingExpirationJob = () => {
    const run = async () => {
        try {
            const expiredCount = await expireStaleBookings({ force: true });
            if (expiredCount > 0) {
                console.log(`Lejárt jelentkezések lezárva: ${expiredCount} db`);
            }
        } catch (error) {
            console.error('Jelentkezés-lejárat frissítési hiba:', error.message);
        }
    };

    const scheduleNextRun = () => {
        const timeout = setTimeout(async () => {
            await run();
            scheduleNextRun();
        }, getMillisecondsUntilNextBudapestMidnight());
        timeout.unref?.();
        return timeout;
    };

    void run();
    return scheduleNextRun();
};

module.exports = {
    expireStaleBookings,
    getBudapestDateKey,
    getMillisecondsUntilNextBudapestMidnight,
    startBookingExpirationJob
};
