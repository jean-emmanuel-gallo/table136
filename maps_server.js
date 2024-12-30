const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Routes pour les données
app.get('/events', (req, res) => {
  const events = JSON.parse(fs.readFileSync('./database/events.json', 'utf8'));
  res.json(events);
});

app.get('/formateurs', (req, res) => {
  const formateurs = JSON.parse(fs.readFileSync('./database/formateurs.json', 'utf8'));
  res.json(formateurs);
});

app.get('/themes', (req, res) => {
  const themes = JSON.parse(fs.readFileSync('./database/themes.json', 'utf8'));
  res.json(themes);
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});