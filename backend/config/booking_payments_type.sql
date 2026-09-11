ALTER TABLE booking_payments
  ADD COLUMN payment_type VARCHAR(20) NOT NULL DEFAULT 'full';
