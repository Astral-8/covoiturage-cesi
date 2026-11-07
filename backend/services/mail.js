const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendConfirmationTrajet(conducteur, withdraw_token) {
  const lienRetirer = `${process.env.BASE_URL}/api/trajets/retirer/${withdraw_token}`;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: conducteur.email,
    subject: '✅ Votre trajet CESI a bien été enregistré',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2>Bonjour ${conducteur.prenom} !</h2>
        <p>Votre trajet depuis <strong>${conducteur.adresse_depart}</strong> vers le CESI Lagord est maintenant visible sur la carte.</p>
        <p>D'autres étudiants pourront vous contacter pour covoiturer avec vous.</p>
        <br>
        <a href="${lienRetirer}" style="background:#e53e3e;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
          🗑️ Retirer ma proposition de covoiturage
        </a>
      </div>
    `,
  });
}

async function sendDemandeCovoiturage(conducteur, demandeur) {
  const lienAccepter = `${process.env.BASE_URL}/api/covoiturage/accepter/${conducteur.id}/${demandeur.email}`;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: conducteur.email,
    subject: '🚗 Nouvelle demande de covoiturage',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2>Bonjour ${conducteur.prenom} !</h2>
        <p><strong>${demandeur.prenom} ${demandeur.nom}</strong> souhaite covoiturer avec vous.</p>
        <p>Email : ${demandeur.email}</p>
        <br>
        <a href="${lienAccepter}" style="background:#38a169;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
          ✅ Accepter la demande
        </a>
      </div>
    `,
  });
}

async function sendAcceptation(demandeur, conducteur) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: demandeur.email,
    subject: '🎉 Votre demande de covoiturage a été acceptée !',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2>Bonne nouvelle ${demandeur.prenom} !</h2>
        <p><strong>${conducteur.prenom} ${conducteur.nom}</strong> a accepté votre demande.</p>
        <p>Contactez-le à : <a href="mailto:${conducteur.email}">${conducteur.email}</a></p>
      </div>
    `,
  });
}

module.exports = { sendConfirmationTrajet, sendDemandeCovoiturage, sendAcceptation };