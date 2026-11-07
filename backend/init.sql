CREATE TABLE IF NOT EXISTS trajets (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(200),
  adresse_depart TEXT,
  coordonnees JSONB,
  token UUID,
  withdraw_token UUID,
  expire_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demandes (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(200),
  trajet_id INTEGER REFERENCES trajets(id),
  created_at TIMESTAMP DEFAULT NOW()
);