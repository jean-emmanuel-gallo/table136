$(document).ready(function () {
    let formateursData = {};
    let themesData = {};

    // Vérification de l'authentification de l'utilisateur
    function checkAuthentication() {
        return fetch('/check-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (!data.authenticated) {
                    alert('Vous devez être connecté pour accéder à cette page.');
                    window.location.href = 'login_admin.html';
                }
            })
            .catch(error => {
                console.error('Erreur lors de la vérification de l\'authentification :', error);
            });
    }

    // Vérification de l'authentification de Véronique et cacher les logs
    $(document).ready(function () {
        $.ajax({
            type: 'POST',
            url: '/check-auth',
            contentType: 'application/json',
            success: function (response) {
                if (response.authenticated && response.username === 'Véronique') {
                    $('li:contains("Logs de Véronique")').hide();
                }
            },
            error: function () {
                console.error('Erreur lors de la vérification de l\'authentification.');
            }
        });
    });

    // Fonction pour charger les données JSON nécessaires
    function loadJsonData() {
        return Promise.all([
            fetch('/database/formateurs.json').then(response => response.json()),
            fetch('/database/themes.json').then(response => response.json())
        ]).then(([formateursJson, themesJson]) => {
            formateursData = Object.fromEntries(formateursJson.formateurs.map(f => [f.id, f]));
            themesData = Object.fromEntries(themesJson.themes.map(t => [t.id, t]));
        });
    }

    // Fonction pour charger les événements archivés depuis dltEvents.json
    function loadArchivedEvents() {
        fetch('/database/dltEvents.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement du fichier JSON');
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data.deletedEvents)) {
                    data.deletedEvents.forEach(event => {
                        let formateursHtml = event.formateur_ids.map(id => {
                            let formateur = formateursData[id];
                            return formateur ? `${formateur.nom} ${formateur.prenom}` : 'N/A';
                        }).join('<br>');

                        let row = `
                            <tr>
                                <td>${themesData[event.theme_id]?.name || 'N/A'}</td>
                                <td>${event.date_debut}</td>
                                <td>${event.date_fin}</td>
                                <td>${event.ville}</td>
                                <td>${event.hotel}</td> 
                                <td>${event.finan}</td>
                                <td>${event.methode}</td>
                                <td>${formateursHtml}</td>
                                <td>${event.choix}</td>
                                <td>${event.num_s}</td>
                                <td><button class="btn btn-primary restore-event-btn" data-event-id="${event.id}">Restaurer</button></td>
                            </tr>
                        `;
                        $('#archived-events-table').append(row);
                    });

                    // Ajouter l'événement de clic pour les boutons de restauration
                    $('.restore-event-btn').on('click', function () {
                        let eventId = $(this).data('event-id');
                        restoreEvent(eventId);
                    });
                } else {
                    $('#archived-events-table').append('<tr><td colspan="11">Aucun événement archivé trouvé.</td></tr>');
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des événements archivés :', error);
                $('#archived-events-table').append('<tr><td colspan="11">Erreur lors du chargement des événements archivés.</td></tr>');
            });
    }

    // Fonction pour restaurer un événement archivé
    function restoreEvent(eventId) {
        fetch('/restore-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventId: eventId })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la restauration de l\'événement');
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                location.reload(); // Recharger la page pour mettre à jour la liste des événements archivés
            })
            .catch(error => {
                console.error('Erreur lors de la restauration de l\'événement :', error);
                alert('Erreur lors de la restauration de l\'événement');
            });
    }

    // Fonction pour gérer la déconnexion
    function logout() {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.text())
            .then(message => {
                alert(message);
                window.location.href = 'login_admin.html';
            })
            .catch(error => {
                console.error('Erreur lors de la déconnexion :', error);
                alert('Erreur lors de la déconnexion');
            });
    }

    // Ajouter l'événement de clic pour le bouton de déconnexion
    $('#logout-btn').on('click', logout);

    // Charger les données JSON et les événements archivés au chargement de la page
    checkAuthentication().then(() => loadJsonData().then(loadArchivedEvents));
});
