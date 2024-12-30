// Récupérer les informations du formateur depuis le localStorage
const formateur = JSON.parse(localStorage.getItem('formateur'));
if (!formateur) {
    // Redirection vers la page de connexion si aucune information de formateur n'est trouvée
    window.location.href = "/formateurs/login.html";
} else {
    // Mettre à jour le nom du formateur dans la navbar
    document.getElementById('formateur-name').textContent = `${formateur.nom} ${formateur.prenom}`;
}

document.getElementById('logout-button').addEventListener('click', function () {
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
        // Rediriger vers la page de login
        window.location.href = "/formateurs/login.html";
    })
    .catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
    });
});

$(document).ready(function() {
    // Initialize datepickers
    $("#date-debut").datepicker({
        dateFormat: "dd/mm/yy",
        onSelect: function(selectedDate) {
            // Quand une date de début est sélectionnée, définir la date minimale pour la date de fin
            $("#date-fin").datepicker("option", "minDate", selectedDate);
        }
    });

    $("#date-fin").datepicker({
        dateFormat: "dd/mm/yy"
    });

    // Load existing indisponibilites from localStorage
    let indisponibilites = JSON.parse(localStorage.getItem('indisponibilites')) || [];
    displayIndisponibilites(indisponibilites);

    // Handle form submission
    $("#indisponibilite-form").submit(function(event) {
        event.preventDefault();

        const dateDebut = $("#date-debut").val();
        const dateFin = $("#date-fin").val();

        if (dateDebut && dateFin) {
            const indisponibilite = { dateDebut, dateFin };
            indisponibilites.push(indisponibilite);

            // Envoyer les indisponibilités au serveur
            $.ajax({
                url: '/update-indisponibilites',  // Chemin de la route dans server.js
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    formateurId: formateur.id,  // Envoie de l'ID du formateur
                    indisponibilites: indisponibilites  // Les indisponibilités mises à jour
                }),
                success: function(response) {
                    // Si la mise à jour est réussie, stocker localement et afficher
                    localStorage.setItem('indisponibilites', JSON.stringify(indisponibilites));
                    displayIndisponibilites(indisponibilites);
                    $("#indisponibilite-form").trigger("reset");
                    showNotification(response.message);
                },
                error: function(err) {
                    console.error('Erreur lors de la mise à jour des indisponibilités :', err);
                    showNotification('Erreur lors de la mise à jour');
                }
            });
        }
    });

    // Display the list of indisponibilites
    function displayIndisponibilites(indisponibilites) {
        const list = $("#indisponibilites-list");
        list.empty();

        indisponibilites.forEach((indisponibilite, index) => {
            const listItem = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Du ${indisponibilite.dateDebut} au ${indisponibilite.dateFin}
                    <button class="btn btn-danger btn-sm" data-index="${index}">Supprimer</button>
                </li>
            `;
            list.append(listItem);
        });

        // Handle delete buttons
        $(".btn-danger").click(function() {
            const index = $(this).data('index');
            indisponibilites.splice(index, 1);
            localStorage.setItem('indisponibilites', JSON.stringify(indisponibilites));

            // Envoyer la mise à jour des indisponibilités au serveur après suppression
            $.ajax({
                url: '/update-indisponibilites',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    formateurId: formateur.id,
                    indisponibilites: indisponibilites
                }),
                success: function(response) {
                    displayIndisponibilites(indisponibilites);  // Actualiser l'affichage
                    showNotification(response.message);
                },
                error: function(err) {
                    console.error('Erreur lors de la suppression des indisponibilités :', err);
                    showNotification('Erreur lors de la suppression');
                }
            });
        });
    }

    // Show notification with background color and auto-hide after 2 seconds
    function showNotification(message) {
        const notification = $('<div class="notification"></div>')
            .text(message)
            .css({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#ec5b15',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                zIndex: 10000
            })
            .appendTo('body');

        setTimeout(function() {
            notification.fadeOut(function() {
                notification.remove();
            });
        }, 2000);
    }

    // Toggle the burger menu and overlay
    $('.navbar-toggler').on('click', function() {
        $(this).toggleClass('open');
        $('#side-menu').toggleClass('open');
        $('#menu-overlay').fadeToggle(); // Afficher ou masquer le voile
    });

    // Fermer le menu si on clique sur l'overlay
    $('#menu-overlay, #close-menu').on('click', function() {
        $('.navbar-toggler').removeClass('open');
        $('#side-menu').removeClass('open');
        $('#menu-overlay').fadeOut();
    });
});
