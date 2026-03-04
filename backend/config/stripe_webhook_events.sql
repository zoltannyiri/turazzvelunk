CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stripe_webhook_events_created_at (created_at)
);
