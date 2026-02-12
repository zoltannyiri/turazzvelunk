CREATE TABLE IF NOT EXISTS tour_equipment_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  equipment_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_tour_equipment (tour_id, equipment_id),
  CONSTRAINT fk_tour_equipment_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  CONSTRAINT fk_tour_equipment_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);