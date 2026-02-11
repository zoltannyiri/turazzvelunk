const Stripe = require('stripe');
const db = require('../config/db');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20'
});

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
            `SELECT b.id, b.status, b.payment_status, b.tour_id, t.title, t.price
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
                        unit_amount: Math.round(Number(booking.price) * 100),
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
            [session.id, user_id, booking.tour_id, booking.id, booking.price, 'huf', 'pending']
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const stripeSessionId = session.id;

        try {
            const [rows] = await db.query(
                'SELECT * FROM booking_payments WHERE stripe_session_id = ? LIMIT 1',
                [stripeSessionId]
            );
            if (rows.length === 0) {
                return res.json({ received: true });
            }

            const payment = rows[0];
            if (payment.status !== 'paid') {
                if (payment.booking_id) {
                    await db.query(
                        'UPDATE bookings SET payment_status = ?, paid_at = NOW() WHERE id = ?',
                        ['paid', payment.booking_id]
                    );
                }
                await db.query(
                    'UPDATE booking_payments SET status = ?, updated_at = NOW() WHERE stripe_session_id = ?',
                    ['paid', stripeSessionId]
                );
            }
        } catch (err) {
            return res.status(500).send('Webhook handler failed');
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
                await db.query(
                    'UPDATE bookings SET payment_status = ?, paid_at = NOW() WHERE id = ?',
                    ['paid', bookingId]
                );
            }
            await db.query(
                'UPDATE booking_payments SET status = ?, updated_at = NOW() WHERE stripe_session_id = ?',
                ['paid', session_id]
            );

            return res.json({ status: 'paid' });
        }

        return res.json({ status: session.payment_status || 'unpaid' });
    } catch (err) {
        return res.status(500).json({ message: 'Session ellenőrzése sikertelen.' });
    }
};
