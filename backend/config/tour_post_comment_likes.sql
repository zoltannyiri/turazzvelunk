ALTER TABLE tour_post_comments
  ADD COLUMN parent_comment_id INT NULL,
  ADD CONSTRAINT fk_post_comments_parent
    FOREIGN KEY (parent_comment_id) REFERENCES tour_post_comments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS tour_post_comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_comment_user (comment_id, user_id),
  CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id) REFERENCES tour_post_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
