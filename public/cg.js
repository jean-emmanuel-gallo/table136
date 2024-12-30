// Vérifier si un utilisateur (admin ou formateur) est déjà connecté lors du chargement de la page
window.addEventListener('DOMContentLoaded', function() {
    fetch('/check-auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.authenticated && data.username) {
            if (data.role === 'admin') {
                // Si l'utilisateur est un admin, rediriger vers la page d'accueil admin
                window.location.href = '/admin/acc_admin.html';
            } else if (data.role === 'formateur') {
                // Si l'utilisateur est un formateur, rediriger vers la page d'accueil formateur
                window.location.href = '/formateurs/accueil_formateur.html';
            }
        }
    })
    .catch(error => console.error('Erreur lors de la vérification de l\'authentification:', error));
});



$(document).ready(function() {
    $('#admin-btn').on('click', function() {
        $('#loading-spinner').show();
        setTimeout(function() {
            window.location.href = '/admin/login_admin.html';
        }, 500); 
    });

    $('#formateurs-btn').on('click', function() {
        $('#loading-spinner').show();
        setTimeout(function() {
            window.location.href = '/formateurs/login.html';
        }, 500); 
    });
});
