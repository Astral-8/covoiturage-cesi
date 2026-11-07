const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const express = require('express');
const router = express.Router();

const CESI_ADRESSE = '8 Rue Isabelle Autissier, 17140 Lagord, France';
let cesiCoords = null;

async function getCesiCoords() {
  if (cesiCoords) return cesiCoords;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(CESI_ADRESSE)}`
  );
  const data = await res.json();
  if (!data.length) throw new Error('Impossible de géocoder le CESI');
  cesiCoords = { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) };
  console.log('CESI backend géocodé :', cesiCoords);
  return cesiCoords;
}

router.get('/', async (req, res) => {
  const { startLon, startLat } = req.query;
  try {
    const cesi = await getCesiCoords();
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.ORS_API_KEY}&start=${startLon},${startLat}&end=${cesi.lon},${cesi.lat}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;