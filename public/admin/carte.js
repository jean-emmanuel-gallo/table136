$(document).ready(function () {
    let map;
    let formateursCache = null; // Cache pour stocker les données des formateurs
    const geocodeCache = {}; // Cache pour stocker les adresses géocodées
    let geocodingInProgress = false; // Pour empêcher plusieurs géocodages en même temps

    // Initialiser la carte
    function initMap() {
        map = L.map('map').setView([43.2965, 5.3698], 10); // Centrer sur Marseille
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
    }

    // Charger la liste des formateurs depuis le fichier JSON
    function populateFormateursList() {
        const formateursList = $('#formateurs-list');
        formateursList.empty(); // Vider la liste avant de la remplir

        // Charger les formateurs si le cache est vide
        if (!formateursCache) {
            $.getJSON('/database/formateurs.json', function (data) {
                formateursCache = data.formateurs; // Mettre les données dans le cache
                addFormateursToList(formateursCache, formateursList);
            }).fail(function () {
                console.error("Impossible de charger le fichier JSON.");
            });
        } else {
            // Utiliser le cache pour afficher les formateurs
            addFormateursToList(formateursCache, formateursList);
        }
    }

    // Ajouter les formateurs à la liste HTML
    function addFormateursToList(formateurs, formateursList) {
        formateurs.forEach(formateur => {
            formateursList.append(`
                <div class="formateur-item" data-formateur-id="${formateur.id}">
                    ${formateur.prenom} ${formateur.nom}
                </div>
            `);
        });
    }

    // Gestion du clic sur un formateur
    $('#formateurs-list').on('click', '.formateur-item', function () {
        const formateurId = $(this).data('formateur-id'); // Récupérer l'ID du formateur cliqué
        const formateur = formateursCache.find(f => f.id === formateurId);

        if (formateur) {
            const adresse = `${formateur.adresse}, ${formateur.ville}, ${formateur.CP}, France`;

            // Vérifier si l'adresse est déjà géocodée
            if (geocodeCache[adresse]) {
                console.log("Adresse trouvée dans le cache :", adresse);
                const { lat, lon } = geocodeCache[adresse];

                // Afficher directement le marqueur à partir du cache
                addMarkerToMap(lat, lon, formateur);
            } else {
                // Géocoder l'adresse si elle n'est pas dans le cache
                geocodeAndPlaceMarker(adresse, formateur);
            }
        } else {
            console.warn("Formateur introuvable pour l'ID :", formateurId);
        }
    });

    // Géocodage et ajout de marqueur
    function geocodeAndPlaceMarker(adresse, formateur) {
        if (geocodingInProgress) {
            console.warn("Géocodage en cours, veuillez patienter.");
            return;
        }

        geocodingInProgress = true; // Bloquer d'autres appels au géocodage
        console.log("Géocodage de l'adresse :", adresse);

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    // Ajouter l'adresse au cache
                    geocodeCache[adresse] = { lat, lon };

                    // Ajouter un marqueur à la carte
                    addMarkerToMap(lat, lon, formateur);
                } else {
                    console.warn("Coordonnées introuvables pour l'adresse :", adresse);
                }
            })
            .catch(error => console.error("Erreur lors du géocodage :", error))
            .finally(() => {
                geocodingInProgress = false; // Libérer le blocage
            });
    }

    // Ajouter un marqueur à la carte
    function addMarkerToMap(lat, lon, formateur) {
        // Effacer les précédents marqueurs (si nécessaire)
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Ajouter le marqueur à la carte
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`${formateur.prenom} ${formateur.nom}<br>${formateur.adresse}<br>${formateur.ville}`)
            .openPopup();

        // Centrer la carte sur le nouveau marqueur
        map.setView([lat, lon], 13);
    }

    // Initialiser la carte et remplir la liste des formateurs au chargement
    initMap();
    populateFormateursList();
});
