const db = require('../config/db');

exports.getAllPosts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, LEFT(p.content, 220) AS excerpt, p.created_at,
              u.id AS author_id, u.name AS author_name,
              (SELECT url FROM blog_post_images i WHERE i.post_id = p.id ORDER BY i.id ASC LIMIT 1) AS cover_image
       FROM blog_posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a blogok lekérésekor.', error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.content, p.created_at,
              u.id AS author_id, u.name AS author_name
       FROM blog_posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bejegyzés nem található.' });
    }
    const [images] = await db.query(
      'SELECT url FROM blog_post_images WHERE post_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    res.json({ ...rows[0], images: images.map(i => i.url) });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a bejegyzés lekérésekor.', error: err.message });
  }
};

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'A cím és a tartalom kötelező.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO blog_posts (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content]
    );
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > 0) {
      const values = files.map(file => [result.insertId, `/uploads/blog/${file.filename}`]);
      await db.query('INSERT INTO blog_post_images (post_id, url) VALUES ?', [values]);
    }
    res.status(201).json({ message: 'Bejegyzés létrehozva.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a bejegyzés mentésekor.', error: err.message });
  }
};

exports.updatePost = async (req, res) => {
  const { title, content } = req.body;
  if (!title && !content) {
    return res.status(400).json({ message: 'Nincs módosítandó adat.' });
  }
  try {
    const [rows] = await db.query('SELECT user_id FROM blog_posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bejegyzés nem található.' });
    }
    const ownerId = Number(rows[0].user_id);
    const isOwner = Number(req.user.id) === ownerId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Nincs jogosultságod a módosításhoz.' });
    }

    const fields = [];
    const values = [];
    if (title) {
      fields.push('title = ?');
      values.push(title);
    }
    if (content) {
      fields.push('content = ?');
      values.push(content);
    }
    values.push(req.params.id);

    await db.query(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, values);

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > 0) {
      const values = files.map(file => [req.params.id, `/uploads/blog/${file.filename}`]);
      await db.query('INSERT INTO blog_post_images (post_id, url) VALUES ?', [values]);
    }
    res.json({ message: 'Bejegyzés frissítve.' });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a módosításkor.', error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id FROM blog_posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Bejegyzés nem található.' });
    }
    const ownerId = Number(rows[0].user_id);
    const isOwner = Number(req.user.id) === ownerId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Nincs jogosultságod a törléshez.' });
    }

    await db.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bejegyzés törölve.' });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a törléskor.', error: err.message });
  }
};
