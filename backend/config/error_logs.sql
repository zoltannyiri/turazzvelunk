CREATE TABLE IF NOT EXISTS error_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(20) NOT NULL DEFAULT 'error',
    message TEXT NOT NULL,
    stack TEXT NULL,
    method VARCHAR(10) NULL,
    path VARCHAR(255) NULL,
    status_code INT NULL,
    user_id INT NULL,
    ip VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_error_logs_created_at (created_at),
    INDEX idx_error_logs_level (level),
    INDEX idx_error_logs_user_id (user_id)
);
