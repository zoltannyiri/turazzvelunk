const express = require('express');
const cors = require('cors');
const tourRoutes = require('./routes/tourRoutes.js');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
require('dotenv').config();

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
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);

app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));