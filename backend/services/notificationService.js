const db = require('../config/db');
const { emitNotificationCreated } = require('./socketService');

const createNotification = async ({ userId, type = 'general', title, message = null, link = null }) => {
  if (!userId || !title) return null;
  const [result] = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, link]
  );
  emitNotificationCreated(userId);
  return result.insertId;
};

const createNotifications = async ({ userIds, type = 'general', title, message = null, link = null }) => {
  const uniqueUserIds = [...new Set((userIds || []).map(Number).filter(Boolean))];
  if (!uniqueUserIds.length || !title) return 0;

  const values = uniqueUserIds.map((userId) => [userId, type, title, message, link]);
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, link) VALUES ?`,
    [values]
  );
  uniqueUserIds.forEach(emitNotificationCreated);
  return uniqueUserIds.length;
};

const createEmailNotifications = async ({ recipients, subject, message, notification = null }) => {
  const emails = [...new Set((Array.isArray(recipients) ? recipients : [recipients])
    .flatMap((value) => String(value || '').split(','))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean))];

  if (!emails.length || !subject) return 0;
  const [users] = await db.query(
    `SELECT id FROM users WHERE LOWER(email) IN (${emails.map(() => '?').join(',')})`,
    emails
  );
  return createNotifications({
    userIds: users.map((user) => user.id),
    type: notification?.type || 'email',
    title: notification?.title || subject,
    message: notification?.message || message || null,
    link: notification?.link || null
  });
};

module.exports = {
  createNotification,
  createNotifications,
  createEmailNotifications
};
