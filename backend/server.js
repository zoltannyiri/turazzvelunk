require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const tourRoutes = require('./routes/tourRoutes.js');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const blogRoutes = require('./routes/blogRoutes');
const tourPostRoutes = require('./routes/tourPostRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const paymentController = require('./controllers/paymentController');


// backend diagnosztika
const dns = require('dns').promises;

(async () => {
  const raw = process.env.DB_HOST;
  const trimmed = (raw || '').trim();

  console.log('DB_HOST raw   =', JSON.stringify(raw));
  console.log('DB_HOST trim  =', JSON.stringify(trimmed));
  console.log('DB_PORT       =', process.env.DB_PORT);

  // extra: karakter-kódok (rejtett \r \n space lebuktatás)
  if (raw) {
    console.log('DB_HOST char codes =', [...raw].map(c => c.charCodeAt(0)));
  }

  try {
    const res = await dns.lookup(trimmed);
    console.log('DNS lookup OK:', res);
  } catch (e) {
    console.log('DNS lookup FAIL:', e.code, e.message);
  }
})();

const app = express();
app.use(cors());
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/tour-posts', tourPostRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/equipment', equipmentRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*'
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-tour', (tourId) => {
    if (tourId) {
      socket.join(`tour:${tourId}`);
    }
  });

  socket.on('leave-tour', (tourId) => {
    if (tourId) {
      socket.leave(`tour:${tourId}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));