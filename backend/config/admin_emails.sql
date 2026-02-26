CREATE TABLE IF NOT EXISTS admin_emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_emails_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admin_email_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email_id INT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  error_message TEXT NULL,
  sent_at TIMESTAMP NULL,
  CONSTRAINT fk_admin_email_recipients_email FOREIGN KEY (email_id) REFERENCES admin_emails(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_email_recipients_email ON admin_email_recipients (recipient_email);
CREATE INDEX idx_admin_email_recipients_email_id ON admin_email_recipients (email_id);
