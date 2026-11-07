require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/trajets', require('./routes/trajets'));
app.use('/covoiturage', require('./routes/covoiturage'));
app.use('/itineraire', require('./routes/itineraire'));
app.use('/admin', require('./routes/admin'));

app.listen(3000, () => console.log('Backend démarré sur le port 3000'));