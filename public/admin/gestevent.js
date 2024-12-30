export function initializeEventModal(eventId, eventsArray, themesData, formateursData, updateJsonData) {
    const event = eventsArray.find(event => event.id == eventId);

    if (!event) {
        console.error("Événement non trouvé pour l'ID :", eventId);
        return;
    }

// Remplir les champs du formulaire avec les valeurs de l'événement
$('#edit-theme').val(themesData[event.theme_id]?.name || '');
$('#edit-date-debut').val(event.date_debut);
$('#edit-date-fin').val(event.date_fin);
$('#edit-ville').val(event.ville);
$('#edit-methode').val(event.methode);
$('#edit-remarque').val(event.remarque || '');
$('#edit-event-id').val(event.id);

// Correction ici
$('#edit-choix').val(event.choix && typeof event.choix === 'string' ? event.choix.toLowerCase() : (event.choix || 'en attente').toString().toLowerCase());

// Afficher le modal
$('#eventModal').modal('show');


    // Gestion du bouton 'Sauvegarder'
    $('#save-event-btn').off('click').on('click', function () {
        const updatedEventId = $('#edit-event-id').val();
        const updatedEventIndex = eventsArray.findIndex(event => event.id == updatedEventId);
    
        if (updatedEventIndex !== -1) {
            // Mettre à jour l'événement avec les nouvelles données
            const updatedEvent = {
                ...eventsArray[updatedEventIndex],
                theme_id: Object.values(themesData).find(theme => theme.name === $('#edit-theme').val())?.id || event.theme_id,
                date_debut: $('#edit-date-debut').val(),
                date_fin: $('#edit-date-fin').val(),
                ville: $('#edit-ville').val(),
                choix: $('#edit-choix').val() ? $('#edit-choix').val().toLowerCase() : 'en attente',
                methode: $('#edit-methode').val(),
                remarque: $('#edit-remarque').val()
            };
    
            // Mettre à jour les statuts des formateurs si applicable
            if (Array.isArray(updatedEvent.formateur_ids) && updatedEvent.formateur_ids.length > 0) {
                if (!updatedEvent.formateur_status) {
                    updatedEvent.formateur_status = {};
                }
                const newStatus = $('#edit-choix').val() ? $('#edit-choix').val().toLowerCase() : 'en attente';
    
                updatedEvent.formateur_ids.forEach(formateurId => {
                    updatedEvent.formateur_status[formateurId] = newStatus;
    
                    // Mettre à jour les dates de statut
                    if (!updatedEvent.formateur_status_dates) {
                        updatedEvent.formateur_status_dates = {};
                    }
                    updatedEvent.formateur_status_dates[formateurId] = new Date().toISOString();
                });
            }
    
            // Remplacer l'événement existant dans le tableau
            eventsArray[updatedEventIndex] = updatedEvent;
    
            // Mettre à jour les données sur le serveur
            updateJsonData().then(() => {
                updateTableRow(eventId, updatedEvent);
                $('#eventModal').modal('hide');
            }).catch(error => {
                console.error("Erreur lors de la mise à jour de l'événement :", error);
            });
        } else {
            console.error("Événement non trouvé pour l'ID :", updatedEventId);
        }
    });
    

    // Gestion du bouton 'Supprimer'
    $('#delete-event-btn').off('click').on('click', function () {
        const deleteEventId = $('#edit-event-id').val();
        const deleteEventIndex = eventsArray.findIndex(event => event.id == deleteEventId);

        if (deleteEventIndex !== -1) {
            const deletedEvent = eventsArray.splice(deleteEventIndex, 1)[0];

            // Déplacer l'événement supprimé dans une archive
            moveToDeletedEvents(deletedEvent).then(() => {
                updateJsonData().then(() => {
                    removeTableRow(deleteEventId);
                    $('#eventModal').modal('hide');
                }).catch(error => {
                    console.error("Erreur lors de la mise à jour après suppression :", error);
                });
            }).catch(error => {
                console.error("Erreur lors de la sauvegarde de l'événement supprimé :", error);
            });
        } else {
            console.error("Événement non trouvé pour l'ID :", deleteEventId);
        }
    });
}

// Met à jour uniquement la ligne concernée dans le tableau
function updateTableRow(eventId, updatedEvent) {
    const row = $(`tr[data-event-id="${eventId}"]`);
    if (row.length === 0) {
        console.error("Impossible de trouver la ligne pour l'ID :", eventId);
        return;
    }

    // Exemple de mise à jour des colonnes
    row.find('td:nth-child(2)').text(updatedEvent.date_debut); // Colonne date début
    row.find('td:nth-child(3)').text(updatedEvent.date_fin);   // Colonne date fin
    row.find('td:nth-child(4)').text(updatedEvent.ville);      // Colonne ville

    // Mise à jour de la colonne 'choix'
    const choixCell = updatedEvent.choix || "En attente";
    row.find('td:nth-child(5)').text(choixCell);

    // Mettre à jour la couleur de la colonne 'choix'
    updateRowChoixColor(row, choixCell);
}

// Met à jour la couleur de la cellule 'choix'
function updateRowChoixColor(row, choixCell) {
    let choixColor = "";

    if (choixCell?.toLowerCase() === "accepté") {
        choixColor = "green";
    } else if (choixCell?.toLowerCase() === "refusé") {
        choixColor = "red";
    } else {
        choixColor = ""; // Aucun style par défaut
    }

    row.find('td:nth-child(5)').css("background-color", choixColor);
}

// Supprime uniquement la ligne correspondant à l'événement
function removeTableRow(eventId) {
    const row = $(`tr[data-event-id="${eventId}"]`);
    if (row.length > 0) {
        row.remove();
        console.log("Ligne supprimée pour l'événement :", eventId);
    } else {
        console.error("Aucune ligne trouvée pour l'ID :", eventId);
    }
}

// Déplace un événement supprimé dans une archive
function moveToDeletedEvents(event) {
    return fetch('/move-to-deleted-events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Événement supprimé sauvegardé :", data.message);
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour des événements supprimés :', error);
        });
}
