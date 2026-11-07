# Covoiturage CESI La Rochelle

Application web de covoiturage pour le CESI de La Rochelle : les étudiants proposent des trajets vers le campus et trouvent des covoitureurs.

## Architecture

- **frontend/** — interface web (HTML/CSS/JS, carte interactive Leaflet)
- **backend/** — API Node.js/Express (trajets, demandes de covoiturage, itinéraires, admin)
- **nginx/** — reverse proxy Nginx (sert le frontend, proxifie l'API, protège la page admin par .htpasswd)
- **db** — PostgreSQL 16 (initialisée par `backend/init.sql`)

## Démarrage

```bash
# 1. Créer le fichier d'environnement du backend
cp backend/.env.example backend/.env
# puis renseigner vos valeurs (DATABASE_URL, SMTP, ORS_API_KEY...)

# 2. Lancer tous les services
docker compose up -d --build
```

L'application est ensuite accessible sur le port 80.

## Fonctionnalités

- Publication de trajets vers le CESI (8 Rue Isabelle Autissier, Lagord)
- Recherche de covoiturages et demande de place
- Calcul d'itinéraire et estimation de distance (OpenRouteService)
- Envoi d'e-mails de confirmation (Nodemailer)
- Page d'administration protégée par mot de passe

## Variables d'environnement

Voir `backend/.env.example`. Ne jamais commité le vrai fichier `.env`.
