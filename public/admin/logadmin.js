$(document).ready(function () {
    // Charger les logs depuis le fichier JSON
    fetch('/database/log_admin.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur HTTP, status ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.logins) {
                // Filtrer les logs uniquement pour Véronique
                const veroniqueLogs = data.logins.filter(log => log.username === "Véronique");

                if (veroniqueLogs.length > 0) {
                    // Afficher les logs
                    veroniqueLogs.forEach(log => {
                        const loginTimeParis = formatDateToParisTimezone(log.loginTime);
                        const logItem = `
                            <div class="log-item">
                                <strong>Date:</strong> ${loginTimeParis} <br>
                                <strong>Action:</strong> ${log.duration}
                            </div>
                        `;
                        $('#logs-list').append(logItem);
                    });
                } else {
                    $('#logs-list').append('<p>Aucun log disponible pour Véronique.</p>');
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
});



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
});