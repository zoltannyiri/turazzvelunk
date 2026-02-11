ALTER TABLE booking_payments
  ADD COLUMN booking_id INT NULL,
  ADD INDEX idx_booking_payments_booking_id (booking_id),
  ADD CONSTRAINT fk_booking_payments_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
