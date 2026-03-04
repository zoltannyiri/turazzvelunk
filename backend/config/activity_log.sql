CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  user_id INT NULL,
  tour_id INT NULL,
  booking_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_log_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_log_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_log_created_at ON activity_log (created_at);
CREATE INDEX idx_activity_log_user_id ON activity_log (user_id);
CREATE INDEX idx_activity_log_tour_id ON activity_log (tour_id);
CREATE INDEX idx_activity_log_type ON activity_log (type);
