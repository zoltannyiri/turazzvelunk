CREATE TABLE IF NOT EXISTS booking_equipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  equipment_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_booking_equip_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_equip_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);