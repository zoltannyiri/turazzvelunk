const db = require('../config/db');
const { sanitizeBlogContent, toPlainText, getReadingMinutes } = require('../utils/blogContent');

exports.uploadEditorImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Válassz ki egy képet.' });
  }

  return res.status(201).json({
    url: `/uploads/blog/${req.file.filename}`
  });
};

exports.getAllPosts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.content, p.created_at, p.updated_at,
              u.id AS author_id, u.name AS author_name,
              (SELECT url FROM blog_post_images i WHERE i.post_id = p.id ORDER BY i.id ASC LIMIT 1) AS cover_image,
              (SELECT COUNT(*) FROM blog_post_images i WHERE i.post_id = p.id) AS image_count
       FROM blog_posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows.map(({ content, ...post }) => {
      const plainText = toPlainText(content);
      return {
        ...post,
        excerpt: plainText.slice(0, 260),
        reading_minutes: getReadingMinutes(content)
      };
    }));
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a blogok lekérésekor.', error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.content, p.created_at, p.updated_at,
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
    res.json({
      ...rows[0],
      content: sanitizeBlogContent(rows[0].content),
      reading_minutes: getReadingMinutes(rows[0].content),
      images: images.map(i => i.url)
    });
  } catch (err) {
    res.status(500).json({ message: 'Szerver hiba történt a bejegyzés lekérésekor.', error: err.message });
  }
};

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  const sanitizedContent = sanitizeBlogContent(content);
  if (!title?.trim() || !toPlainText(sanitizedContent)) {
    return res.status(400).json({ message: 'A cím és a tartalom kötelező.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO blog_posts (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title.trim(), sanitizedContent]
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
  const { title, content, keep_images } = req.body;
  if (title === undefined && content === undefined && keep_images === undefined && !req.files?.length) {
    return res.status(400).json({ message: 'Nincs módosítandó adat.' });
  }
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ message: 'A cím nem lehet üres.' });
  }
  if (content !== undefined && !content.trim()) {
    return res.status(400).json({ message: 'A tartalom nem lehet üres.' });
  }
  const sanitizedContent = content !== undefined ? sanitizeBlogContent(content) : null;
  if (content !== undefined && !toPlainText(sanitizedContent)) {
    return res.status(400).json({ message: 'A tartalom nem lehet üres.' });
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
    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title.trim());
    }
    if (content !== undefined) {
      fields.push('content = ?');
      values.push(sanitizedContent);
    }
    if (fields.length > 0) {
      values.push(req.params.id);
      await db.query(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (keep_images !== undefined) {
      let keepImages = [];
      try {
        const parsed = JSON.parse(keep_images);
        keepImages = Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return res.status(400).json({ message: 'Érvénytelen képlista.' });
      }
      if (keepImages.length > 0) {
        await db.query(
          `DELETE FROM blog_post_images WHERE post_id = ? AND url NOT IN (${keepImages.map(() => '?').join(',')})`,
          [req.params.id, ...keepImages]
        );
      } else {
        await db.query('DELETE FROM blog_post_images WHERE post_id = ?', [req.params.id]);
      }
    }

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
