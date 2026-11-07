const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware auth simple
function auth(req, res, next) {
  const b64 = (req.headers.authorization || '').split(' ')[1] || '';
  const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
  if (user === 'numerilab' && pass === 'numerilab') return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).send('Accès refusé');
}

// Liste tous les trajets
router.get('/trajets', auth, async (req, res) => {
  const result = await db.query('SELECT * FROM trajets ORDER BY created_at DESC');
  res.json(result.rows);
});

// Supprimer un trajet
router.delete('/trajets/:id', auth, async (req, res) => {
  await db.query('DELETE FROM demandes WHERE trajet_id = $1', [req.params.id]);
  await db.query('DELETE FROM trajets WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;