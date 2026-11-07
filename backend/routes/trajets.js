const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendConfirmationTrajet } = require('../services/mail');

// Récupérer tous les trajets non expirés
router.get('/', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM trajets WHERE expire_at IS NULL OR expire_at > NOW()'
  );
  res.json(result.rows);
});

// Inscrire un nouveau trajet
router.post('/', async (req, res) => {
  const { nom, prenom, email, adresse_depart, coordonnees, expire_at } = req.body;
  const token = uuidv4();
  const withdraw_token = uuidv4();
  await db.query(
    `INSERT INTO trajets (nom, prenom, email, adresse_depart, coordonnees, token, withdraw_token, expire_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [nom, prenom, email, adresse_depart, JSON.stringify(coordonnees), token, withdraw_token, expire_at || null]
  );
  await sendConfirmationTrajet({ nom, prenom, email, adresse_depart }, withdraw_token);
  res.json({ success: true });
});

// Retirer un trajet via le lien du mail
// Affiche une page de confirmation (le scanner de mail s'arrête ici)
router.get('/retirer/:withdraw_token', async (req, res) => {
  const { withdraw_token } = req.params;
  const result = await db.query(
    'SELECT * FROM trajets WHERE withdraw_token = $1',
    [withdraw_token]
  );
  if (result.rows.length === 0)
    return res.status(404).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0f1a;color:white;">
        <h2>❌ Trajet introuvable ou déjà retiré.</h2>
      </body></html>
    `);

  const trajet = result.rows[0];
  res.send(`
    <html>
    <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0f1a;color:white;">
      <div style="max-width:480px;margin:auto;background:#1a1a2e;padding:40px;border-radius:16px;border:1px solid rgba(99,102,241,0.3);">
        <h2 style="color:#a5b4fc;margin-bottom:16px;">Retirer votre trajet</h2>
        <p style="color:#94a3b8;margin-bottom:32px;">
          Vous êtes sur le point de retirer votre trajet depuis<br>
          <strong style="color:#e2e8f0;">${trajet.adresse_depart}</strong><br>
          vers le CESI Lagord.
        </p>
        <form method="POST" action="/api/trajets/retirer/${withdraw_token}">
          <button type="submit" style="background:#e53e3e;color:white;padding:14px 32px;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:600;">
            🗑️ Confirmer le retrait
          </button>
        </form>
        <p style="margin-top:20px;font-size:12px;color:#475569;">Si vous ne souhaitez pas retirer votre trajet, fermez simplement cette page.</p>
      </div>
    </body>
    </html>
  `);
});

// Suppression réelle uniquement après confirmation manuelle (POST)
router.post('/retirer/:withdraw_token', async (req, res) => {
  const { withdraw_token } = req.params;
  const result = await db.query(
    'DELETE FROM trajets WHERE withdraw_token = $1 RETURNING *',
    [withdraw_token]
  );
  if (result.rows.length === 0)
    return res.status(404).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0f1a;color:white;">
        <h2>❌ Trajet introuvable ou déjà retiré.</h2>
      </body></html>
    `);

  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0f1a;color:white;">
      <div style="max-width:480px;margin:auto;background:#1a1a2e;padding:40px;border-radius:16px;border:1px solid rgba(99,102,241,0.3);">
        <h2 style="color:#10b981;">✅ Votre trajet a bien été retiré.</h2>
        <p style="color:#94a3b8;margin-top:16px;">Merci d'avoir utilisé la plateforme de covoiturage CESI.</p>
      </div>
    </body></html>
  `);
});

module.exports = router;