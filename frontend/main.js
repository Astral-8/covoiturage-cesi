const API = '/api';
const CESI_ADRESSE = '8 Rue Isabelle Autissier, 17140 Lagord';
const CESI_LABEL = 'CESI — Bâtiment Lab In\'Tech, 8 Rue Isabelle Autissier, 17140 Lagord';
let CESI = null; // Sera rempli dynamiquement

async function geocoderCESI() {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&countrycodes=fr&limit=1&q=${encodeURIComponent(CESI_ADRESSE)}`
  );
  const data = await res.json();
  if (!data.length) {
    console.error('Impossible de géocoder le CESI, coordonnées de secours utilisées');
    return [46.168, -1.115];
  }
  console.log('CESI géocodé :', data[0].display_name, data[0].lat, data[0].lon);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// Palette de couleurs pour les trajets
const COULEURS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#ef4444', '#06b6d4', '#8b5cf6', '#f97316',
  '#84cc16', '#14b8a6'
];

function couleurPourTrajet(id) {
  return COULEURS[id % COULEURS.length];
}

// --- CARTE ---
const map = L.map('map').setView([46.1603, -1.1511], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Géocoder le CESI au démarrage
(async () => {
  CESI = await geocoderCESI();
  L.marker(CESI).addTo(map)
    .bindPopup(`<strong>🎓 ${CESI_LABEL}</strong><br>Destination commune`)
    .openPopup();
  chargerTrajets();
})();

// --- NOTICE ---
const modalNotice = document.getElementById('modal-notice');

if (!localStorage.getItem('notice_seen')) {
  modalNotice.classList.remove('hidden');
}

document.getElementById('btn-ok-notice').addEventListener('click', () => {
  localStorage.setItem('notice_seen', '1');
  modalNotice.classList.add('hidden');
});

document.getElementById('btn-notice').addEventListener('click', () => {
  modalNotice.classList.remove('hidden');
});

// --- VALIDATION EMAIL ---
function emailValide(email) {
  return email.endsWith('@cesi.fr') || email.endsWith('@viacesi.fr');
}

// --- CHARGER LES TRAJETS ---
async function chargerTrajets() {
  map.eachLayer(layer => {
    if (layer._isTrajet) map.removeLayer(layer);
  });

  const res = await fetch(`${API}/trajets`);
  const trajets = await res.json();

  trajets.forEach(trajet => {
    if (!trajet.coordonnees) return;
    const coords = trajet.coordonnees.map(c => [c[1], c[0]]);
    const couleur = couleurPourTrajet(trajet.id);

    const ligne = L.polyline(coords, {
      color: couleur,
      weight: 4,
      opacity: 0.85
    }).addTo(map);
    ligne._isTrajet = true;

    const ligneClic = L.polyline(coords, {
      color: 'transparent',
      weight: 22,
      opacity: 0
    }).addTo(map);
    ligneClic._isTrajet = true;

    ligneClic.on('click', (e) => {
      const expire = trajet.expire_at
        ? `<br><span style="color:#64748b;font-size:11px;">Expire le ${new Date(trajet.expire_at).toLocaleDateString('fr-FR')}</span>`
        : '';
      const popupContent = `
        <span style="color:#94a3b8;font-size:12px;">Trajet anonyme</span><br>
        Depuis : ${trajet.adresse_depart}${expire}
        <button class="popup-btn" onclick="ouvrirDemande(${trajet.id}, '${trajet.prenom}', '${trajet.nom}', '${trajet.adresse_depart}')">
          🤝 Demander un covoiturage
        </button>
      `;
      L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
    });

    ligneClic.on('mouseover', () => ligne.setStyle({ weight: 7, opacity: 1 }));
    ligneClic.on('mouseout', () => ligne.setStyle({ weight: 4, opacity: 0.85 }));
  });
}

window.ouvrirDemande = function(id, prenom, nom, adresse) {
  trajetSelectionne = { id, prenom, nom, adresse_depart: adresse };
  document.getElementById('demande-info').textContent =
    `Trajet depuis ${adresse} vers le CESI Lagord`;
  document.getElementById('modal-demande').classList.remove('hidden');
  map.closePopup();
};

// --- DEMANDE COVOITURAGE ---
let trajetSelectionne = null;

document.getElementById('btn-submit-demande').addEventListener('click', async () => {
  const nom = document.getElementById('d-nom').value.trim();
  const prenom = document.getElementById('d-prenom').value.trim();
  const email = document.getElementById('d-email').value.trim();

  if (!nom || !prenom || !email) return alert('Remplis tous les champs !');
  if (!emailValide(email)) return alert('❌ L\'email doit se terminer par @cesi.fr ou @viacesi.fr');

  try {
    const res = await fetch(`${API}/covoiturage/demande`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, trajet_id: trajetSelectionne.id })
    });

    if (!res.ok) throw new Error('Erreur réseau ou problème serveur');

    alert('✅ Demande envoyée ! Le conducteur recevra un email.');
    document.getElementById('modal-demande').classList.add('hidden');
    document.getElementById('d-nom').value = '';
    document.getElementById('d-prenom').value = '';
    document.getElementById('d-email').value = '';
  } catch (err) {
    alert('❌ Oups ! La demande n\'a pas pu aboutir : ' + err.message);
  }
});

// --- INSCRIRE UN TRAJET ---
document.getElementById('btn-inscrire').addEventListener('click', () => {
  document.getElementById('modal-inscrire').classList.remove('hidden');
});

document.getElementById('btn-submit-trajet').addEventListener('click', async () => {
  const btn = document.getElementById('btn-submit-trajet');
  if (btn.disabled) return;

  const nom = document.getElementById('i-nom').value.trim();
  const prenom = document.getElementById('i-prenom').value.trim();
  const email = document.getElementById('i-email').value.trim();
  const adresse = document.getElementById('i-adresse').value.trim();
  const expire_at = document.getElementById('i-expire').value || null;

  if (!nom || !prenom || !email || !adresse) return alert('Remplis tous les champs !');
  if (!emailValide(email)) return alert('❌ L\'email doit se terminer par @cesi.fr ou @viacesi.fr');

  // Désactiver le bouton pendant le traitement
  btn.disabled = true;
  btn.textContent = 'Calcul en cours...';

  const coords = await calculerItineraire(adresse);
  if (!coords) {
    btn.disabled = false;
    btn.textContent = 'Valider';
    return;
  }

  try {
    const res = await fetch(`${API}/trajets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, adresse_depart: adresse, coordonnees: coords, expire_at })
    });

    if (!res.ok) throw new Error('Impossible d\'inscrire le trajet côté serveur.');

    btn.disabled = false;
    btn.textContent = 'Valider';
    alert('✅ Trajet inscrit ! Tu vas recevoir un email de confirmation.');
    document.getElementById('modal-inscrire').classList.add('hidden');
    ['i-nom','i-prenom','i-email','i-adresse','i-expire'].forEach(id => document.getElementById(id).value = '');
    autocompleteList.innerHTML = '';
    chargerTrajets();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Valider';
    alert('❌ Une erreur est survenue : ' + err.message);
  }
});

// --- AUTOCOMPLETE ADRESSE ---
let debounceTimer;
const inputAdresse = document.getElementById('i-adresse');
const autocompleteList = document.getElementById('autocomplete-list');

inputAdresse.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = inputAdresse.value.trim();
  if (q.length < 3) { autocompleteList.innerHTML = ''; return; }

  debounceTimer = setTimeout(async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=fr&limit=5&q=${encodeURIComponent(q)}`
    );
    const data = await res.json();
    autocompleteList.innerHTML = '';
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.display_name;
      li.addEventListener('click', () => {
        inputAdresse.value = item.display_name;
        autocompleteList.innerHTML = '';
      });
      autocompleteList.appendChild(li);
    });
  }, 1000); // Nominatim exige max 1 requête/sec (1000ms) pour éviter les bans
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-wrap')) autocompleteList.innerHTML = '';
});

// --- CALCUL ITINERAIRE ---
async function calculerItineraire(adresseDepart) {
  try {
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=fr&limit=1&q=${encodeURIComponent(adresseDepart)}`
    );
    const geoData = await geo.json();
    if (!geoData.length) { alert("Adresse introuvable"); return null; }

    const lon = parseFloat(geoData[0].lon);
    const lat = parseFloat(geoData[0].lat);

    const route = await fetch(`/api/itineraire?startLon=${lon}&startLat=${lat}`);
    const routeData = await route.json();

    if (!routeData.features) {
      alert("Impossible de calculer l'itinéraire");
      return null;
    }
    return routeData.features[0].geometry.coordinates;
  } catch(err) {
    alert('Erreur : ' + err.message);
    return null;
  }
}

// --- FERMER MODALS ---
document.querySelectorAll('.btn-fermer').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  });
});