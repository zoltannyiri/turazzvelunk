ALTER TABLE equipment
  ADD COLUMN is_passenger_transport TINYINT(1) NOT NULL DEFAULT 0 AFTER total_quantity,
  ADD COLUMN seats_per_unit INT NULL AFTER is_passenger_transport;
