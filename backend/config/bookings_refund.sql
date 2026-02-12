ALTER TABLE bookings
  ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN refund_status ENUM('none','pending','completed') DEFAULT 'none';