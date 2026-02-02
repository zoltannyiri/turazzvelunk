const db = require('../config/db');

exports.getPostsByTourId = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.tour_id, p.title, p.content, p.created_at,
              u.id AS author_id, u.name AS author_name,
              (SELECT COUNT(*) FROM tour_post_likes l WHERE l.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM tour_post_comments c WHERE c.post_id = p.id) AS comment_count
       FROM tour_posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.tour_id = ?
       ORDER BY p.created_at DESC`,
      [req.params.tourId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a bejegyzések lekérésekor.', error: err.message });
  }
};

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'A tartalom kötelező.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO tour_posts (tour_id, user_id, title, content) VALUES (?, ?, ?, ?)',
      [req.params.tourId, req.user.id, title || null, content.trim()]
    );
    const io = req.app.get('io');
    if (io) {
      io.to(`tour:${req.params.tourId}`).emit('tour-post-created', {
        tourId: Number(req.params.tourId),
        postId: result.insertId
      });
    }
    res.status(201).json({ message: 'Bejegyzés létrehozva.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a bejegyzés mentésekor.', error: err.message });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.content, c.created_at, c.parent_comment_id,
              u.id AS author_id, u.name AS author_name,
              (SELECT COUNT(*) FROM tour_post_comment_likes l WHERE l.comment_id = c.id) AS like_count
       FROM tour_post_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.postId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a kommentek lekérésekor.', error: err.message });
  }
};

exports.getTopCommentsByPostId = async (req, res) => {
  const limit = Number(req.query.limit || 2);
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.content, c.created_at, c.parent_comment_id,
              u.id AS author_id, u.name AS author_name,
              (SELECT COUNT(*) FROM tour_post_comment_likes l WHERE l.comment_id = c.id) AS like_count
       FROM tour_post_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.parent_comment_id IS NULL
       ORDER BY like_count DESC, c.created_at DESC
       LIMIT ?`,
      [req.params.postId, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a top kommentek lekérésekor.', error: err.message });
  }
};

exports.createComment = async (req, res) => {
  const { content, parent_comment_id } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'A komment szövege kötelező.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO tour_post_comments (post_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)',
      [req.params.postId, req.user.id, content.trim(), parent_comment_id || null]
    );
    const [rows] = await db.query('SELECT tour_id FROM tour_posts WHERE id = ?', [req.params.postId]);
    const io = req.app.get('io');
    if (io && rows.length > 0) {
      io.to(`tour:${rows[0].tour_id}`).emit('tour-post-comment', {
        tourId: Number(rows[0].tour_id),
        postId: Number(req.params.postId)
      });
    }
    res.status(201).json({ message: 'Komment létrehozva.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a komment mentésekor.', error: err.message });
  }
};

exports.toggleCommentLike = async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM tour_post_comment_likes WHERE comment_id = ? AND user_id = ?',
      [req.params.commentId, req.user.id]
    );

    if (existing.length > 0) {
      await db.query('DELETE FROM tour_post_comment_likes WHERE comment_id = ? AND user_id = ?', [req.params.commentId, req.user.id]);
    } else {
      await db.query('INSERT INTO tour_post_comment_likes (comment_id, user_id) VALUES (?, ?)', [req.params.commentId, req.user.id]);
    }

    const [countRows] = await db.query('SELECT COUNT(*) AS like_count FROM tour_post_comment_likes WHERE comment_id = ?', [req.params.commentId]);
    res.json({ liked: existing.length === 0, like_count: countRows[0].like_count });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a komment like műveletnél.', error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM tour_post_likes WHERE post_id = ? AND user_id = ?',
      [req.params.postId, req.user.id]
    );

    if (existing.length > 0) {
      await db.query('DELETE FROM tour_post_likes WHERE post_id = ? AND user_id = ?', [req.params.postId, req.user.id]);
    } else {
      await db.query('INSERT INTO tour_post_likes (post_id, user_id) VALUES (?, ?)', [req.params.postId, req.user.id]);
    }

    const [countRows] = await db.query('SELECT COUNT(*) AS like_count FROM tour_post_likes WHERE post_id = ?', [req.params.postId]);
    const [rows] = await db.query('SELECT tour_id FROM tour_posts WHERE id = ?', [req.params.postId]);
    const io = req.app.get('io');
    if (io && rows.length > 0) {
      io.to(`tour:${rows[0].tour_id}`).emit('tour-post-like', {
        tourId: Number(rows[0].tour_id),
        postId: Number(req.params.postId),
        like_count: countRows[0].like_count
      });
    }
    res.json({ liked: existing.length === 0, like_count: countRows[0].like_count });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a like műveletnél.', error: err.message });
  }
};
