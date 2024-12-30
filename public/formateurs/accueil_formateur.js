$(document).ready(function() {
    const socket = io(); // Initialiser la connexion Socket.IO

    // Vérifier si le formateur est stocké dans localStorage
    const formateur = JSON.parse(localStorage.getItem('formateur'));
    if (!formateur) {
        // Rediriger vers la page de connexion si aucune information de formateur n'est trouvée
        window.location.href = `${window.location.origin}/formateurs/login.html`;
    } else {
        // Mettre à jour le nom du formateur dans la navbar
        $('#formateur-name').text(`${formateur.nom} ${formateur.prenom}`);
    }

    // Gestion de la déconnexion
    $('#logout-button').on('click', function() {
        // Envoyer une requête au serveur pour enregistrer la déconnexion
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.text())
        .then(data => {
            console.log('Déconnexion réussie:', data);
            // Supprimer les informations du formateur du localStorage
            localStorage.removeItem('formateur');
            // Rediriger vers la page de connexion
            window.location.href = `${window.location.origin}/formateurs/login.html`;
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
    });

    // Charger les événements et les thèmes depuis le serveur
    Promise.all([
        fetch('/database/events.json').then(response => response.json()),
        fetch('/database/themes.json').then(response => response.json())
    ])
    .then(([eventsData, themesData]) => {
        const events = eventsData.events;
        const themes = themesData.themes;
        console.log('Événements chargés:', events);
        console.log('Thèmes chargés:', themes);

        // Filtrer les événements assignés au formateur
        const assignedEvents = events.filter(event =>
            event.formateur_ids.includes(formateur.id.toString()) ||
            event.formateur_ids.includes(Number(formateur.id))
        );
        console.log('Événements assignés:', assignedEvents);

        // Afficher les événements
        displayAssignedEvents(assignedEvents, themes, formateur.id);
        checkPendingValidations(assignedEvents, themes);
        highlightUpcomingEvents(assignedEvents); // Vérifier les événements à venir

        // Écouteur pour le dropdown de filtre
        $('#event-filter').on('change', function() {
            const filterValue = $(this).val();
            filterEvents(assignedEvents, themes, formateur.id, filterValue);
        });
    })
    .catch(error => {
        console.error('Erreur lors du chargement des événements ou des thèmes:', error);
    });

    // Fonction pour filtrer les événements
// Fonction pour filtrer les événements
function filterEvents(events, themes, formateurId, filterValue) {
    let filteredEvents = events;

    if (filterValue === 'accepted') {
        filteredEvents = events.filter(event => event.formateur_status && event.formateur_status[formateurId] === 'accepté');
    } else if (filterValue === 'refused') {
        filteredEvents = events.filter(event => event.formateur_status && event.formateur_status[formateurId] === 'refusé');
    } else if (filterValue === 'pending-cancel') {
        filteredEvents = events.filter(event => event.formateur_status && event.formateur_status[formateurId] === 'pending-cancel');
    } else if (filterValue === 'pending') { // Nouveau filtre pour les événements en attente
        filteredEvents = events.filter(event => {
            return !event.formateur_status || event.formateur_status[formateurId] === 'En attente';
        });
    } else if (filterValue === 'past') {
        const today = new Date();
        filteredEvents = events.filter(event => {
            const eventEndDate = new Date(event.date_fin.split('/').reverse().join('-'));
            return eventEndDate < today;
        });
    }

    displayAssignedEvents(filteredEvents, themes, formateurId);
}

    // Fonction pour afficher les événements assignés
    function displayAssignedEvents(events, themes, formateurId, filterEventId = null) {
        const eventsTableBody = $('#events-table tbody');
        eventsTableBody.empty(); // Vider le tableau
    
        // Filtrer les événements si un ID est fourni
        const filteredEvents = filterEventId ? events.filter(event => event.id == filterEventId) : events;
    
        if (filteredEvents.length === 0) {
            const row = $('<tr>').html('<td colspan="6" class="text-center">Aucun événement assigné</td>');
            eventsTableBody.append(row);
            return;
        }
    
        filteredEvents.forEach(event => {
            const mainTheme = themes.find(theme => theme.id === event.theme_id);
            const secondaryTheme = event.secondary_theme_id
                ? themes.find(theme => theme.id === event.secondary_theme_id)
                : null;
    
            const formateurStatus = event.formateur_status && event.formateur_status[formateurId]
                ? event.formateur_status[formateurId]
                : 'En attente';
    
            const row = $('<tr>').addClass('event-row').attr('data-event-id', event.id);
            if (formateurStatus === 'accepté') {
                row.addClass('accepted');
            } else if (formateurStatus === 'refusé') {
                row.addClass('refused');
            } else if (formateurStatus === 'pending-cancel') {
                row.addClass('pending-cancel');
            }
    
            const isDisabled = formateurStatus === 'accepté' || formateurStatus === 'refusé' || formateurStatus === 'pending-cancel';
    
            // Combinaison des thèmes
            const combinedThemes = secondaryTheme
                ? `${mainTheme.name} + ${secondaryTheme.name}`
                : mainTheme.name;
    
            row.html(`
                <td>${combinedThemes}</td>
                <td>${event.date_debut}</td>
                <td>${event.date_fin}</td>
                <td>${event.ville}</td>
                <td>${event.methode}</td>
                <td class="actions-cell">
                    <button class="accept-btn btn btn-success" data-event-id="${event.id}" ${isDisabled ? 'disabled' : ''}>Accepter</button>
                    <button class="refuse-btn btn btn-danger" data-event-id="${event.id}" ${isDisabled ? 'disabled' : ''}>Refuser</button>
                    <button class="cancel-btn btn btn-warning" data-event-id="${event.id}" ${formateurStatus === 'accepté' ? '' : 'style="display:none"'}>Annuler</button>
                </td>
            `);
    
            eventsTableBody.append(row);
        });
    
        // Gérer les boutons Accepter/Refuser
        $('.accept-btn').on('click', function () {
            const eventId = $(this).data('event-id');
            const event = events.find(e => e.id === eventId);
            const relatedEvents = getRelatedEvents(event, events);
    
            if (relatedEvents.length > 0) {
                $('#relatedEventsModal').modal('show');
                $('#relatedEventsModal .modal-body').html(`
                    Cet événement partage la même date avec les événements suivants :
                    <ul>
                        ${relatedEvents.map(e => `<li>${e.methode} - ${e.date_debut}</li>`).join('')}
                    </ul>
                    En acceptant cet événement, vous devez accepter les événements liés également.
                `);
    
                $('#confirmRelatedAccept').off('click').on('click', function () {
                    relatedEvents.forEach(e => updateEventStatus(e.id, formateurId, 'accepté'));
                    updateEventStatus(event.id, formateurId, 'accepté');
                    $('#relatedEventsModal').modal('hide');
                });
            } else {
                updateEventStatus(event.id, formateurId, 'accepté');
            }
        });
    
        $('.refuse-btn').on('click', function () {
            const eventId = $(this).data('event-id');
            const event = events.find(e => e.id === eventId);
            const relatedEvents = getRelatedEvents(event, events);
    
            if (relatedEvents.length > 0) {
                $('#relatedEventsModal').modal('show');
                $('#relatedEventsModal .modal-body').html(`
                    Cet événement partage la même date avec les événements suivants :
                    <ul>
                        ${relatedEvents.map(e => `<li>${e.methode} - ${e.date_debut}</li>`).join('')}
                    </ul>
                    En refusant cet événement, tous les événements liés seront également refusés.
                `);
    
                $('#confirmRelatedRefuse').off('click').on('click', function () {
                    relatedEvents.forEach(e => updateEventStatus(e.id, formateurId, 'refusé'));
                    updateEventStatus(event.id, formateurId, 'refusé');
                    $('#relatedEventsModal').modal('hide');
                });
            } else {
                updateEventStatus(event.id, formateurId, 'refusé');
            }
        });
    }
    
    
    $(document).on('click', '.cancel-btn', function () {
        const eventId = $(this).data('event-id');
        console.log(`Bouton Annuler cliqué pour l'événement ID : ${eventId}`);
    
        // Afficher le modal dynamique
        createDynamicCancelModal(eventId);
    });
    
    function createDynamicCancelModal(eventId) {
        $('#dynamicCancelModal').remove(); // Supprimer tout modal existant
    
        // Créer un modal dynamique
        const modal = $(`
            <div class="modal fade" id="dynamicCancelModal" tabindex="-1" role="dialog" aria-labelledby="dynamicCancelModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="dynamicCancelModalLabel">Confirmation d'annulation</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            Voulez-vous annuler cet événement ?
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Non</button>
                            <button type="button" class="btn btn-primary" id="confirmCancelDynamicBtn">Oui</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    
        $('body').append(modal);
        $('#dynamicCancelModal').modal('show');
    
        // Gérer le clic sur "Oui" dans le modal
        $('#confirmCancelDynamicBtn').off('click').on('click', function () {
            console.log(`Confirmation d'annulation pour l'événement ID : ${eventId}`);
            $('#dynamicCancelModal').modal('hide');
    
            // Mettre à jour le statut de l'événement
            updateEventStatus(eventId, formateur.id, 'pending-cancel')
                .then(() => console.log('Mise à jour réussie pour l\'événement.'));
        });
    }
    
    
    // Exemple d'utilisation : clic sur un bouton "Annuler"
    $('.cancel-btn').on('click', function () {
        const eventId = $(this).data('event-id');
        console.log(`Bouton Annuler cliqué pour l'événement ID : ${eventId}`);
        createDynamicCancelModal(eventId); // Génère et ouvre le modal
    });
    
    
    function updateEventStatus(eventId, formateurId, status) {
        return fetch('/update-event-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, formateurId, status }),
        })
            .then(response => {
                if (!response.ok) throw new Error('Erreur lors de la mise à jour de l\'événement.');
                return response.json();
            })
            .then(data => {
                console.log('Mise à jour réussie côté serveur:', data);
    
                // Rafraîchir uniquement la ligne de l'événement mis à jour
                refreshSingleEvent(eventId, status);
    
                return data;
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour de l\'événement :', error);
            });
    }
    
    function refreshSingleEvent(eventId, status) {
        const row = $(`tr[data-event-id="${eventId}"]`);
        if (row.length === 0) {
            console.error(`Impossible de trouver la ligne pour l'événement ID : ${eventId}`);
            return;
        }
    
        // Appliquer le statut et le style visuel
        row.removeClass('accepted refused pending-cancel').addClass('pending-cancel');
        row.css('background-color', 'yellow'); // Mettre l'arrière-plan en jaune
    
        // Désactiver tous les boutons de la ligne sauf "Annuler"
        row.find('.accept-btn, .refuse-btn').hide();
        row.find('.cancel-btn').prop('disabled', true);
    
        // Mettre à jour le texte ou statut affiché, si nécessaire
        const statusCell = row.find('.status-cell'); // Assurez-vous que la cellule du statut existe
        if (statusCell.length > 0) {
            statusCell.text('En attente d\'annulation');
        }
    
        console.log(`Ligne de l'événement ID : ${eventId} mise à jour avec le statut : ${status}`);
    }
    
    

    // Mettre à jour l'état de l'événement
function updateEventStatus(eventId, formateurId, status) {
    fetch('/database/events.json')
        .then(response => response.json())
        .then(eventsData => {
            const event = eventsData.events.find(event => event.id === eventId); // Trouver l'événement principal

            if (event) {
                // Mise à jour du statut de l'événement principal
                if (!event.formateur_status) {
                    event.formateur_status = {};
                }
                event.formateur_status[formateurId] = status;

                // Rechercher les événements liés
                const relatedEvents = eventsData.events.filter(relatedEvent =>
                    relatedEvent.id !== event.id &&
                    relatedEvent.date_debut === event.date_debut &&
                    relatedEvent.formateur_ids.includes(formateurId)
                );

                // Mise à jour des statuts des événements liés
                relatedEvents.forEach(relatedEvent => {
                    if (!relatedEvent.formateur_status) {
                        relatedEvent.formateur_status = {};
                    }
                    relatedEvent.formateur_status[formateurId] = status;
                });

                // Recalculer les choix pour l'événement principal et les événements liés
                event.choix = determineEventChoix(event);
                relatedEvents.forEach(relatedEvent => {
                    relatedEvent.choix = determineEventChoix(relatedEvent);
                });

                // Sauvegarder les modifications
                const updatedEvents = eventsData.events.map(evt => {
                    if (evt.id === event.id) return event; // Mettre à jour l'événement principal
                    const related = relatedEvents.find(rel => rel.id === evt.id);
                    return related || evt; // Mettre à jour les événements liés ou conserver les autres
                });

                const updatedData = { ...eventsData, events: updatedEvents };

                updateJsonData(updatedData).then(() => {
                    // Rafraîchir les événements affichés
                    const assignedEvents = updatedEvents.filter(evt =>
                        evt.formateur_ids.includes(formateurId.toString()) ||
                        evt.formateur_ids.includes(Number(formateurId))
                    );

                    fetch('/database/themes.json')
                        .then(response => response.json())
                        .then(themesData => {
                            displayAssignedEvents(assignedEvents, themesData.themes, formateurId);
                        });
                });

                // Envoyer les mises à jour via Socket.IO
                [event, ...relatedEvents].forEach(updatedEvent => {
                    socket.emit('formateurAction', {
                        eventId: updatedEvent.id,
                        formateurId: formateurId,
                        formateurName: `${formateur.prenom} ${formateur.nom}`,
                        eventDate: updatedEvent.date_debut,
                        status: status
                    });
                });
            } else {
                console.error(`Événement avec l'ID ${eventId} non trouvé.`);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour de l\'événement :', error);
        });
}

    


    // Déterminer l'état global d'un événement
    function determineEventChoix(event) {
        const statusValues = Object.values(event.formateur_status);
        if (statusValues.includes('refusé') && statusValues.includes('accepté')) {
            return 'Partiellement accepté/refusé';
        } else if (statusValues.every(status => status === 'accepté')) {
            return 'Accepté';
        } else if (statusValues.every(status => status === 'refusé')) {
            return 'Refusé';
        } else if (statusValues.every(status => status === 'pending-cancel')) {
            return 'Demande en attente';
        } else {
            return 'En attente';
        }
    }

    // Mettre à jour le fichier JSON
    function updateJsonData(data) {
        return fetch('/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch((error) => {
            console.error('Erreur:', error);
        });
    }

    // Vérifier les validations en attente
    function checkPendingValidations(events, themes) {
        const oneMonth = 30 * 24 * 60 * 60 * 1000; // Un mois en millisecondes
        const now = new Date();
        const pendingEvents = events.filter(event => {
            const eventStartDate = new Date(event.date_debut.split('/').reverse().join('-'));
            const timeDiff = eventStartDate - now;
            const isPending = !event.formateur_status || event.formateur_status[formateur.id] === 'En attente';
            return isPending && timeDiff <= oneMonth && timeDiff > 0;
        });

        const notificationBadge = $('#notification-badge');
        const notificationsList = $('#notifications-list');

        if (pendingEvents.length > 0) {
            notificationBadge.show().text(pendingEvents.length);
            notificationsList.empty(); // Vider la liste des notifications
            pendingEvents.forEach(event => {
                const theme = themes.find(theme => theme.id === event.theme_id);
                const notificationItem = $('<div>').addClass('dropdown-item').text(`${theme ? theme.name : 'N/A'} - ${event.date_debut}`);
                notificationItem.on('click', () => {
                    displayAssignedEvents(events, themes, formateur.id, event.id);
                });
                notificationsList.append(notificationItem);
            });
        } else {
            notificationBadge.hide();
        }
    }

    function getRelatedEvents(currentEvent, allEvents) {
        return allEvents.filter(event => {
            return event.id !== currentEvent.id && event.date_debut === currentEvent.date_debut;
        });
    }
    

    // Vérifier les événements à venir dans moins de 3 mois
    function highlightUpcomingEvents(events) {
        const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000; // 3 mois en millisecondes
        const now = new Date();
        const upcomingEvents = events.filter(event => {
            const eventStartDate = new Date(event.date_debut.split('/').reverse().join('-'));
            const timeDiff = eventStartDate - now;
            return timeDiff <= threeMonths && timeDiff > 0 && (!event.formateur_status || event.formateur_status[formateur.id] === 'En attente');
        });

        if (upcomingEvents.length > 0) {
            upcomingEvents.forEach(event => {
                $(`.event-row[data-event-id="${event.id}"]`).css('background-color', 'yellow'); // Faire clignoter l'événement
                $(`.event-row[data-event-id="${event.id}"]`).fadeOut(500).fadeIn(500);
            });
        }
    }

    // Gestion du burger menu et du voile
    $('.navbar-toggler').on('click', function() {
        $(this).toggleClass('open');
        $('#side-menu').toggleClass('open');
        $('#menu-overlay').fadeToggle();
    });

    $('#menu-overlay, #close-menu').on('click', function() {
        $('.navbar-toggler').removeClass('open');
        $('#side-menu').removeClass('open');
        $('#menu-overlay').fadeOut();
    });
});


