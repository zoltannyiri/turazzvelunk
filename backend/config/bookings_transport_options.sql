ALTER TABLE bookings
  ADD COLUMN transport_minibus TINYINT(1) DEFAULT 0,
  ADD COLUMN transport_trailer_2 TINYINT(1) DEFAULT 0,
  ADD COLUMN transport_trailer_4 TINYINT(1) DEFAULT 0,
  ADD COLUMN transport_car_trailer TINYINT(1) DEFAULT 0,
  ADD COLUMN extra_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0;