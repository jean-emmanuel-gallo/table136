const fs = require('fs');
const path = require('path');

const eventsFilePath = path.join(__dirname, 'events.json');
const themesFilePath = path.join(__dirname, 'themes.json');

fs.readFile(eventsFilePath, 'utf8', (err, eventsData) => {
  if (err) {
    console.error('Error reading events file:', err);
    return;
  }

  fs.readFile(themesFilePath, 'utf8', (err, themesData) => {
    if (err) {
      console.error('Error reading themes file:', err);
      return;
    }

    const events = JSON.parse(eventsData).events;
    const themes = JSON.parse(themesData).themes;
    const themesMap = new Map(themes.map(theme => [theme.id, theme]));

    let missingThemes = new Set();

    events.forEach(event => {
      if (!themesMap.has(event.theme_id)) {
        missingThemes.add(event.theme_id);
        console.error(`Thème non trouvé pour l'événement id ${event.id}`);
      }
    });

    if (missingThemes.size > 0) {
      console.log('IDs de thèmes manquants:', Array.from(missingThemes));
    } else {
      console.log('Toutes les IDs de thèmes sont valides.');
    }
  });
});
