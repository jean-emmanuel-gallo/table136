document.addEventListener('DOMContentLoaded', async () => {
    const map = L.map('map').setView([46.2276, 2.2137], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const [eventsData, formateursData, themesData] = await Promise.all([
        fetch('/events').then(res => res.json()),
        fetch('/formateurs').then(res => res.json()),
        fetch('/themes').then(res => res.json())
    ]);

    const events = eventsData.events;
    const formateurs = formateursData.formateurs;
    const themes = themesData.themes;

    const themeSelect = document.getElementById('theme-select');
    const distanceInput = document.getElementById('distance');
    const formateurList = document.getElementById('formateur-list');
    let selectedFormateurs = []; // Liste des formateurs sélectionnés

    // Remplir la liste déroulante des événements
    themeSelect.innerHTML = '<option value="">Sélectionnez un thème et une ville</option>';
    events.sort((a, b) => a.ville.localeCompare(b.ville)).forEach(event => {
        const theme = themes.find(t => t.id === event.theme_id);
        if (theme) {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = `${theme.name} - ${event.ville} (${event.date_debut})`;
            themeSelect.appendChild(option);
        }
    });

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async function addFormateursToEvent(eventId) {
        console.log('Données envoyées au serveur :', { formateur_ids: selectedFormateurs });
        try {
            const response = await fetch(`/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formateur_ids: selectedFormateurs })
            });
            if (response.ok) {
                alert('Formateurs ajoutés avec succès !');
                selectedFormateurs = [];
                updateMapAndDetails();
            } else {
                const errorData = await response.json();
                console.error('Erreur lors de l’ajout des formateurs :', errorData);
                alert('Erreur lors de l’ajout des formateurs.');
            }
        } catch (error) {
            console.error('Erreur réseau :', error);
            alert('Erreur lors de la communication avec le serveur.');
        }
    }

    function renderAddButton(eventId) {
        let addButton = document.getElementById('add-button');
        if (selectedFormateurs.length > 0) {
            if (!addButton) {
                addButton = document.createElement('button');
                addButton.id = 'add-button';
                addButton.textContent = 'Ajouter';
                addButton.style.backgroundColor = '#ec5b15';
                addButton.style.color = '#fff';
                addButton.style.padding = '10px 20px';
                addButton.style.border = 'none';
                addButton.style.cursor = 'pointer';
                addButton.onclick = () => addFormateursToEvent(eventId);
                formateurList.insertBefore(addButton, formateurList.firstChild);
            }
        } else if (addButton) {
            addButton.remove();
        }
    }

    function toggleFormateurSelection(formateurId, eventId) {
        if (selectedFormateurs.includes(formateurId)) {
            selectedFormateurs = selectedFormateurs.filter(id => id !== formateurId);
        } else {
            selectedFormateurs.push(formateurId);
        }
        renderAddButton(eventId);
    }

    function updateMapAndDetails() {
        // Effacez les anciens marqueurs et cercles
        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                map.removeLayer(layer);
            }
        });
    
        const selectedEventId = parseInt(themeSelect.value);
        const maxDistance = parseFloat(distanceInput.value);
    
        if (!selectedEventId || isNaN(maxDistance) || maxDistance <= 0) {
            alert('Veuillez sélectionner un événement et entrer une distance valide.');
            return;
        }
    
        const selectedEvent = events.find(event => event.id === selectedEventId);
        if (!selectedEvent) {
            alert('Événement invalide.');
            return;
        }
    
        // Centre de la carte sur l'événement
        map.setView([selectedEvent.latitude, selectedEvent.longitude], 10);
    
        // Ajoutez un marqueur pour l'événement
// Ajouter un marqueur rouge pour l'événement
L.marker([selectedEvent.latitude, selectedEvent.longitude], {
    icon: L.divIcon({
        className: 'event-marker',
        html: '<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
    })
}).addTo(map).bindPopup(`
    <strong>Événement</strong><br>
    ${selectedEvent.ville}<br>
    Du ${selectedEvent.date_debut} au ${selectedEvent.date_fin}
`);

    
        // Ajoutez un cercle autour de l'événement
        L.circle([selectedEvent.latitude, selectedEvent.longitude], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.1,
            radius: maxDistance * 1000
        }).addTo(map);
    
        formateurList.innerHTML = `
            <h3>Formateurs disponibles</h3>
            <div class="event-location">
                <strong>Événement à ${selectedEvent.ville}</strong>
                <div>Du ${selectedEvent.date_debut} au ${selectedEvent.date_fin}</div>
                <div>Rayon de recherche : ${maxDistance} km</div>
            </div>
        `;
    
        const eventStart = new Date(selectedEvent.date_debut);
        const eventEnd = new Date(selectedEvent.date_fin);
    
        // Filtrer les formateurs
        const nearbyFormateurs = formateurs.filter(formateur => {
            const distance = calculateDistance(
                selectedEvent.latitude, selectedEvent.longitude,
                formateur.latitude, formateur.longitude
            );
            const isAffiliated = formateur.themes?.includes(selectedEvent.theme_id);
            const isAvailable = !formateur.indisponibilites || formateur.indisponibilites.every(indispo => {
                const indispoStart = new Date(indispo.date_debut);
                const indispoEnd = new Date(indispo.date_fin);
                return eventEnd < indispoStart || eventStart > indispoEnd;
            });
            return distance <= maxDistance && isAffiliated && isAvailable;
        });
    
        // Affichez les formateurs sur la carte et dans la liste
        nearbyFormateurs.forEach(formateur => {
            const distance = calculateDistance(
                selectedEvent.latitude, selectedEvent.longitude,
                formateur.latitude, formateur.longitude
            );
    
            // Ajouter un marqueur pour chaque formateur
            L.marker([formateur.latitude, formateur.longitude]).addTo(map).bindPopup(`
                <strong>Formateur</strong><br>
                ${formateur.nom}<br>
                Ville : ${formateur.ville}<br>
                Distance : ${Math.round(distance * 10) / 10} km
            `);
    
            // Ajouter le formateur à la liste
            const formateurItem = document.createElement('div');
            formateurItem.classList.add('formateur-item');
            formateurItem.innerHTML = `
                <label>
                    <input type="checkbox" value="${formateur.id}">
                    ${formateur.nom} (${formateur.ville}) - ${Math.round(distance * 10) / 10} km
                </label>
            `;
            formateurItem.querySelector('input').addEventListener('change', () => toggleFormateurSelection(formateur.id, selectedEventId));
            formateurList.appendChild(formateurItem);
        });
    
        if (nearbyFormateurs.length === 0) {
            formateurList.innerHTML += `
                <div class="no-formateur-message">
                    Aucun formateur trouvé dans un rayon de ${maxDistance} km, affilié au thème et disponible aux dates spécifiées.
                </div>
            `;
        }
    }
    

    themeSelect.addEventListener('change', updateMapAndDetails);
    distanceInput.addEventListener('input', updateMapAndDetails);

    updateMapAndDetails();
});
