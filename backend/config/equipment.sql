CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  total_quantity INT NOT NULL DEFAULT 0,
  is_passenger_transport TINYINT(1) NOT NULL DEFAULT 0,
  seats_per_unit INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
