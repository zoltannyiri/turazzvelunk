ALTER TABLE tour_equipment_prices
  ADD COLUMN is_full_rental TINYINT(1) NOT NULL DEFAULT 0;
