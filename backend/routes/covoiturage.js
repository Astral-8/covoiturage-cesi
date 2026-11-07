const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendDemandeCovoiturage, sendAcceptation } = require('../services/mail');

// Demander un covoiturage
router.post('/demande', async (req, res) => {
  const { nom, prenom, email, trajet_id } = req.body;

  const trajet = await db.query('SELECT * FROM trajets WHERE id = $1', [trajet_id]);
  if (trajet.rows.length === 0) return res.status(404).json({ error: 'Trajet introuvable' });

  const conducteur = trajet.rows[0];

  // Sauvegarder la demande
  await db.query(
    `INSERT INTO demandes (nom, prenom, email, trajet_id) VALUES ($1, $2, $3, $4)`,
    [nom, prenom, email, trajet_id]
  );

  // Envoyer mail au conducteur
  await sendDemandeCovoiturage(conducteur, { nom, prenom, email });

  res.json({ success: true });
});

// Conducteur accepte la demande via le lien dans son mail
router.get('/accepter/:trajet_id/:email_demandeur', async (req, res) => {
  const { trajet_id, email_demandeur } = req.params;

  const trajet = await db.query('SELECT * FROM trajets WHERE id = $1', [trajet_id]);
  const demande = await db.query(
    'SELECT * FROM demandes WHERE trajet_id = $1 AND email = $2',
    [trajet_id, email_demandeur]
  );

  if (!trajet.rows.length || !demande.rows.length)
    return res.status(404).send('Demande introuvable');

  // Envoyer mail au demandeur avec les infos du conducteur
  await sendAcceptation(demande.rows[0], trajet.rows[0]);

  res.send('Covoiturage accepté ! Un mail a été envoyé au demandeur.');
});

module.exports = router;