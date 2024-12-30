$(document).ready(function() {
    // Vérifier l'authentification
    $.ajax({
        type: 'POST',
        url: '/check-auth',
        contentType: 'application/json',
        success: function(response) {
            if (response.authenticated && response.username === 'Véronique') {
                // Cacher l'élément "Logs de Véronique" si l'utilisateur est Véronique
                $('li:contains("Logs de Véronique")').hide();
            }
        },
        error: function() {
            console.error('Erreur lors de la vérification de l\'authentification.');
        }
    });

    // Charger les logs depuis le fichier JSON
    fetch('/database/log_formateur.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur HTTP, status ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.logins) {
                // Afficher les logs de tous les formateurs
                if (data.logins.length > 0) {
                    data.logins.forEach(log => {
                        const loginTimeParis = formatDateToParisTimezone(log.loginTime);
                        const logItem = `
                            <div class="log-item">
                                <strong>Formateur:</strong> ${log.username} <br>
                                <strong>Date:</strong> ${loginTimeParis} <br>
                                <strong>Action:</strong> ${log.duration}
                            </div>
                        `;
                        $('#logs-list').append(logItem);
                    });
                } else {
                    $('#logs-list').append('<p>Aucun log disponible pour les formateurs.</p>');
                }
            } else {
                $('#logs-list').append('<p>Format de données inattendu.</p>');
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des logs:', error);
            $('#logs-list').append('<p>Erreur lors du chargement des logs. Vérifiez les permissions du fichier ou l\'URL.</p>');
        });

    // Gestion de la déconnexion
    $('#logout-btn').on('click', function () {
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
            console.error('Erreur lors de la déconnexion:', error);
        });
    });

    // Fonction pour formater la date avec le fuseau horaire de Paris
    function formatDateToParisTimezone(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            timeZone: 'Europe/Paris',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    // Initialiser le client Socket.IO
    const socket = io();

    // Écouter les événements 'notifyAdmin'
    socket.on('notifyAdmin', function(data) {
        console.log('Notification reçue :', data);
        // Afficher le bouton pour rediriger vers ../acc_admin.html
        afficherBoutonNotification(data);
    });

    // Fonction pour afficher le bouton de notification
    function afficherBoutonNotification(data) {
        // Vérifier si le bouton existe déjà
        if ($('#btn-redirection').length === 0) {
            // Créer le bouton avec le message approprié
            const message = `Le formateur ${data.formateurName} a ${data.status} l'événement du ${data.eventDate}`;
            const bouton = $(`
                <div id="notification-container" style="margin-bottom: 20px;">
                    <div class="alert alert-info" role="alert">
                        ${message} 
                        <button id="btn-redirection" class="btn btn-warning ml-3">Voir détails</button>
                    </div>
                </div>
            `);
            // Ajouter un gestionnaire d'événement pour la redirection
            bouton.find('#btn-redirection').on('click', function() {
                window.location.href = 'acc_admin.html';
            });
            // Ajouter le bouton au début du container principal de la page
            $('.container').prepend(bouton);
        }
    }
});
