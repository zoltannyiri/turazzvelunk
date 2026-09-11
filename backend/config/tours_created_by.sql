ALTER TABLE tours
  ADD COLUMN created_by INT NULL AFTER id,
  ADD INDEX idx_tours_created_by (created_by),
  ADD CONSTRAINT fk_tours_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
