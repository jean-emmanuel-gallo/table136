// Vérifier si l'admin est déjà connecté au chargement de la page
window.addEventListener('load', function() {
    fetch('/check-auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.authenticated && data.username) {
            // Si l'admin est déjà connecté, rediriger vers acc_admin.html
            window.location.href = '/admin/acc_admin.html';
        }
    })
    .catch(error => console.error('Erreur lors de la vérification de l\'authentification:', error));
});


document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    
    fetch('/login/admin', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        if (data === 'success') {
            // Enregistrer l'heure de connexion
            localStorage.setItem('adminLoginTime', new Date().toISOString());
            window.location.href = '/admin/dashboard';
        } else {
            alert('Nom d\'utilisateur ou mot de passe incorrect');
        }
    });
});

// Gérer la déconnexion pour calculer la durée de session
window.addEventListener('beforeunload', function() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (loginTime) {
        const logoutTime = new Date().toISOString();
        const adminUsername = localStorage.getItem('adminUsername'); // Récupérer le nom d'utilisateur (sauvegardé lors de la connexion)

        if (adminUsername) {
            const duration = calculateSessionDuration(loginTime, logoutTime);
            
            // Envoyer les informations de connexion au serveur pour les enregistrer
            fetch('/log/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: adminUsername,
                    loginTime: loginTime,
                    logoutTime: logoutTime,
                    duration: duration
                })
            });
        }
    }
});

// Fonction pour calculer la durée de session en minutes
function calculateSessionDuration(loginTime, logoutTime) {
    const loginDate = new Date(loginTime);
    const logoutDate = new Date(logoutTime);
    const durationMs = logoutDate - loginDate;
    const durationMinutes = Math.floor(durationMs / 60000); // Convertir en minutes
    return durationMinutes;
}
