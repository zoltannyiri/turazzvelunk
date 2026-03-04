const Stripe = require('stripe');
const db = require('../config/db');
const { logActivity } = require('../services/activityService');
const { sendPaymentEmail, sendAdminNotification } = require('../services/emailService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20'
});

const shouldSkipWebhook = async (event) => {
    if (!event?.id) return false;
    try {
        await db.query(
            'INSERT INTO stripe_webhook_events (stripe_event_id, event_type) VALUES (?, ?)',
            [event.id, event.type || 'unknown']
        );
        return false;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return true;
        }
        throw err;
    }
};

const finalizePaidBooking = async ({ payment, booking }) => {
    try {
        const [tourRows] = await db.query('SELECT title FROM tours WHERE id = ?', [payment.tour_id]);
        const [userRows] = await db.query('SELECT name, email FROM users WHERE id = ?', [payment.user_id]);
        const title = tourRows[0]?.title || 'ismeretlen túra';
        const userName = userRows[0]?.name || 'Ismeretlen felhasználó';
        await logActivity({
            type: 'booking_paid',
            message: `${userName} befizette a túrát: ${title}`,
            userId: payment.user_id,
            tourId: payment.tour_id,
            bookingId: payment.booking_id
        });
        if (userRows.length > 0 && userRows[0].email) {
            await sendPaymentEmail({
                to: userRows[0].email,
                name: userName,
                tourTitle: title,
                amount: booking?.total_price || payment.amount
            });
        }
        await sendAdminNotification({
            subject: `Befizetés: ${title}`,
            message: `${userName} befizette a túrát. Összeg: ${Number(payment.amount || 0).toLocaleString('hu-HU')} Ft.`
        });
    } catch (logErr) {
        console.error('Tevékenységnapló hiba:', logErr.message);
    }
};

const getClientOrigin = (req) => {
    const origin = req?.headers?.origin;
    if (origin && /^https?:\/\//i.test(origin)) {
        return origin;
    }
    return process.env.CLIENT_ORIGIN || 'http://localhost:5173';
};

exports.createCheckoutSession = async (req, res) => {
    const { booking_id } = req.body;
    const user_id = req.user.id;

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Stripe nincs konfigurálva.' });
    }

    try {
        const [bookingRows] = await db.query(
            `SELECT b.id, b.status, b.payment_status, b.tour_id, b.total_price, t.title, t.price
             FROM bookings b
             JOIN tours t ON b.tour_id = t.id
             WHERE b.id = ? AND b.user_id = ?`,
            [booking_id, user_id]
        );
        if (bookingRows.length === 0) {
            return res.status(404).json({ message: 'Foglalás nem található.' });
        }
        const booking = bookingRows[0];
        if (booking.status !== 'confirmed') {
            return res.status(400).json({ message: 'A foglalás még nincs jóváhagyva.' });
        }
        if (booking.payment_status === 'paid') {
            return res.status(400).json({ message: 'A foglalás már ki van fizetve.' });
        }

        const amountToPay = Number(booking.total_price || booking.price || 0);

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            success_url: `${getClientOrigin(req)}/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getClientOrigin(req)}/profile?payment=cancel`,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'huf',
                        unit_amount: Math.round(amountToPay * 100),
                        product_data: {
                            name: booking.title
                        }
                    }
                }
            ],
            metadata: {
                tour_id: String(booking.tour_id),
                booking_id: String(booking.id),
                user_id: String(user_id)
            }
        });

        await db.query(
            'INSERT INTO booking_payments (stripe_session_id, user_id, tour_id, booking_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [session.id, user_id, booking.tour_id, booking.id, amountToPay, 'huf', 'pending']
        );

        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).send('Stripe webhook secret missing');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const duplicateEvent = await shouldSkipWebhook(event);
        if (duplicateEvent) {
            return res.json({ received: true });
        }
    } catch (err) {
        return res.status(500).send('Webhook handler failed');
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object;
        const stripeSessionId = session.id;
        const conn = await db.getConnection();

        try {
            await conn.beginTransaction();
            const [rows] = await conn.query(
                'SELECT * FROM booking_payments WHERE stripe_session_id = ? LIMIT 1 FOR UPDATE',
                [stripeSessionId]
            );
            if (rows.length === 0) {
                await conn.commit();
                return res.json({ received: true });
            }

            const payment = rows[0];
            if (payment.status === 'paid') {
                await conn.commit();
                return res.json({ received: true });
            }

            let bookingRow = null;
            let bookingUpdated = false;
            if (payment.booking_id) {
                const [bookingRows] = await conn.query(
                    'SELECT id, payment_status, total_price FROM bookings WHERE id = ? LIMIT 1 FOR UPDATE',
                    [payment.booking_id]
                );
                bookingRow = bookingRows[0] || null;
                if (bookingRow && bookingRow.payment_status !== 'paid') {
                    await conn.query(
                        'UPDATE bookings SET payment_status = ?, paid_at = NOW() WHERE id = ? AND payment_status <> ?',
                        ['paid', payment.booking_id, 'paid']
                    );
                    bookingUpdated = true;
                }
            }

            await conn.query(
                'UPDATE booking_payments SET status = ?, updated_at = NOW() WHERE stripe_session_id = ?',
                ['paid', stripeSessionId]
            );

            await conn.commit();

            if (bookingUpdated) {
                await finalizePaidBooking({ payment, booking: bookingRow });
            }
        } catch (err) {
            await conn.rollback();
            return res.status(500).send('Webhook handler failed');
        } finally {
            conn.release();
        }
    }

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object;
        try {
            await db.query(
                'UPDATE booking_payments SET status = ?, updated_at = NOW() WHERE stripe_session_id = ?',
                ['failed', session.id]
            );
        } catch (err) {
            return res.status(500).send('Webhook handler failed');
        }
    }

    res.json({ received: true });
};

exports.confirmCheckoutSession = async (req, res) => {
    const { session_id } = req.body;
    const user_id = req.user.id;

    if (!session_id) {
        return res.status(400).json({ message: 'Hiányzó session_id.' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        const metadataUserId = session?.metadata?.user_id;
        if (!metadataUserId || String(metadataUserId) !== String(user_id)) {
            return res.status(403).json({ message: 'Nincs jogosultság ehhez a session-höz.' });
        }

        if (session.payment_status === 'paid') {
            const bookingId = session?.metadata?.booking_id;
            if (bookingId) {
                const [bookingRows] = await db.query(
                    'SELECT payment_status, tour_id, total_price FROM bookings WHERE id = ? AND user_id = ? LIMIT 1',
                    [bookingId, user_id]
                );
                const alreadyPaid = bookingRows[0]?.payment_status === 'paid';
                if (!alreadyPaid) {
                    await db.query(
                        'UPDATE bookings SET payment_status = ?, paid_at = NOW() WHERE id = ?',
                        ['paid', bookingId]
                    );
                    try {
                        const [tourRows] = await db.query('SELECT title FROM tours WHERE id = ?', [bookingRows[0]?.tour_id]);
                        const [userRows] = await db.query('SELECT name, email FROM users WHERE id = ?', [user_id]);
                        const title = tourRows[0]?.title || 'ismeretlen túra';
                        const userName = userRows[0]?.name || 'Ismeretlen felhasználó';
                        await logActivity({
                            type: 'booking_paid',
                            message: `${userName} befizette a túrát: ${title}`,
                            userId: user_id,
                            tourId: bookingRows[0]?.tour_id || null,
                            bookingId
                        });
                        if (userRows.length > 0 && userRows[0].email) {
                            await sendPaymentEmail({
                                to: userRows[0].email,
                                name: userName,
                                tourTitle: title,
                                amount: bookingRows[0]?.total_price || 0
                            });
                        }
                        await sendAdminNotification({
                            subject: `Befizetés: ${title}`,
                            message: `${userName} befizette a túrát.`
                        });
                    } catch (logErr) {
                        console.error('Tevékenységnapló hiba:', logErr.message);
                    }
                }
            }
            await db.query(
                'UPDATE booking_payments SET status = ?, updated_at = NOW() WHERE stripe_session_id = ?',
                ['paid', session_id]
            );

            return res.json({ status: 'paid', booking_id: bookingId || null });
        }

        return res.json({ status: session.payment_status || 'unpaid', booking_id: session?.metadata?.booking_id || null });
    } catch (err) {
        return res.status(500).json({ message: 'Session ellenőrzése sikertelen.' });
    }
};
