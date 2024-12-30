const socket = io();


// Fonction pour formater l'heure en français (fuseau horaire de Paris)
function formatDateToFrenchTime(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(date));
}

// Gestion du burger menu et du voile
$('.navbar-toggler').on('click', function () {
    $(this).toggleClass('open');
    $('#side-menu').toggleClass('open');
    $('#menu-overlay').fadeToggle();
});

$('#menu-overlay, #close-menu').on('click', function () {
    $('.navbar-toggler').removeClass('open');
    $('#side-menu').removeClass('open');
    $('#menu-overlay').fadeOut();
});

// Fonction pour afficher une pop-up dynamique
function showPopup(message, type = 'success') {
    const popup = $('<div></div>')
        .addClass('dynamic-popup')
        .text(message)
        .css({
            "background": type === 'success' ? '#ec5b15' : '#ff4d4d',
            "color": "#fff",
            "padding": "10px 20px",
            "border-radius": "5px",
            "position": "fixed",
            "top": "50%",
            "left": "50%",
            "transform": "translate(-50%, -50%)",
            "z-index": "1000",
            "box-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
            "font-size": "14px",
            "text-align": "center",
            "min-width": "200px"
        });

    $('body').append(popup);

    setTimeout(() => {
        popup.fadeOut(500, () => popup.remove());
    }, 2000);
}



function updateNotification(formateurId, formateurNom, formateurPrenom) {
    // Récupérer les notifications existantes
    $.get('/notifications.json')
        .done(function (data) {
            let notifications = Array.isArray(data.notifications) ? data.notifications : [];

            // Supprimer toutes les notifications existantes pour ce formateur
            notifications = notifications.filter(notification => notification.id_formateur !== formateurId);

            // Ajouter une nouvelle notification pour ce formateur
            const newNotification = {
                id: Date.now(),
                id_formateur: formateurId,
                type: 'update_formateur',
                message: `Le formateur ${formateurPrenom} ${formateurNom} a mis à jour ses informations.`,
                timestamp: new Date().toISOString()
            };

            notifications.push(newNotification); // Ajouter la nouvelle notification

            // Sauvegarder toutes les notifications mises à jour
            $.ajax({
                url: '/update-notifications',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ notifications }), // Sauvegarde propre des notifications
                success: function () {
                    console.log('Notifications mises à jour avec succès.');
                },
                error: function (xhr, status, error) {
                    console.error('Erreur lors de la mise à jour des notifications :', error);
                }
            });
        })
        .fail(function () {
            console.error('Erreur : Impossible de charger les notifications.');
        });

    // Émettre l'événement pour la mise à jour des coordonnées
    socket.emit('formateurUpdate', {
        formateurId: formateurId,
        formateurName: `${formateurPrenom} ${formateurNom}`
    });
}


    


// Charger les informations du formateur connecté
$(document).ready(function () {
    $.get('/api/formateur-data', function (response) {
        if (response.status === 'success' && response.formateur) {
            const formateur = response.formateur;

            $('#nom').val(formateur.nom);
            $('#prenom').val(formateur.prenom);
            $('#ville').val(formateur.ville || '');
            $('#telephone').val(formateur.téléphone || '');
            $('#mail').val(formateur.mail || '');
            $('#adresse').val(formateur.adresse || '');
            $('#cp').val(formateur.CP || '');
        } else {
            showPopup('Erreur : Impossible de charger les données.', 'error');
        }
    }).fail(function () {
        showPopup('Erreur : Impossible de contacter le serveur.', 'error');
    });


    

    $('#update-info').on('click', function () {
        const updatedData = {
            ville: $('#ville').val(),
            telephone: $('#telephone').val(),
            mail: $('#mail').val(),
            adresse: $('#adresse').val(),
            cp: $('#cp').val()
        };
    
        if (!updatedData.ville || !updatedData.telephone || !updatedData.mail || !updatedData.adresse || !updatedData.cp) {
            showPopup('Tous les champs doivent être remplis.', 'error');
            return;
        }
    
        // Envoyer les données mises à jour au serveur
        $.post('/update-formateur-info', updatedData, function (response) {
            if (response.status === 'success') {
                showPopup('Informations mises à jour avec succès.');
    
                // Appeler la fonction de notification après succès
                const formateur = response.formateur;
                if (formateur && formateur.id && formateur.nom && formateur.prenom) {
                    updateNotification(formateur.id, formateur.nom, formateur.prenom);
                } else {
                    console.error('Données du formateur manquantes dans la réponse.');
                }
            } else {
                showPopup('Erreur lors de la mise à jour des informations.', 'error');
            }
        }).fail(function () {
            showPopup('Erreur de communication avec le serveur.', 'error');
        });
    });
    
    
    

    

    
    

    // Modification de mot de passe
    $('#update-password').on('click', function () {
        const currentPassword = $('#current-password').val();
        const newPassword = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showPopup('Veuillez remplir tous les champs.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showPopup('Les nouveaux mots de passe ne correspondent pas.', 'error');
            return;
        }

        $.post('/update-password', {
            email: $('#mail').val(),
            newPassword
        }, function (response) {
            if (response.status === 'success') {
                showPopup('Mot de passe modifié avec succès.');
            } else {
                showPopup('Erreur lors de la modification du mot de passe.', 'error');
            }
        }).fail(function () {
            showPopup('Erreur de communication avec le serveur.', 'error');
        });
    });

    // Gestion de la déconnexion
    $('#logout-button').on('click', function () {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.text())
        .then(data => {
            console.log('Déconnexion réussie:', data);
            localStorage.removeItem('formateur');
            window.location.href = `${window.location.origin}/formateurs/login.html`;
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
    });
});
