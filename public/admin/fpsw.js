// Initialisation de Socket.IO
const socket = io();

document.addEventListener("DOMContentLoaded", () => {
    const requestsList = document.getElementById('requests-list');
    const modalPrenom = document.getElementById('modal-prenom');
    const modalNom = document.getElementById('modal-nom');
    const modalPassword = document.getElementById('modal-password');
    const sendPasswordBtn = document.getElementById('send-password-btn');
    const sendAllIdentifiantsBtn = document.getElementById('send-all-identifiants-btn'); // Nouveau bouton
    const modalText = document.getElementById('modal-text');

    // Charger les demandes de réinitialisation
    fetchRequests();

    // Fonction pour récupérer les demandes depuis le fichier JSON
    function fetchRequests() {
        fetch('/database/fp.json')
            .then(handleFetchErrors)
            .then(data => renderRequests(data.demandes))
            .catch(error => {
                console.error('Erreur lors de la récupération des demandes :', error);
                alert('Erreur lors de la récupération des demandes.');
            });
    }

    // Fonction pour gérer les erreurs de fetch
    function handleFetchErrors(response) {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données.');
        }
        return response.json();
    }

    // Afficher les demandes dans la liste
    function renderRequests(demandes) {
        requestsList.innerHTML = ""; // Vider la liste existante

        demandes.forEach(request => {
            const requestItem = document.createElement('div');
            requestItem.classList.add('request-item');
            requestItem.setAttribute('data-email', request.mail); // Assigner un attribut pour l'email

            const formattedDate = new Date(request.date).toLocaleString(); // Formater la date

            // Vérifier si les prénoms et noms sont définis, sinon afficher un message
            const prenom = request.formateur_nom || 'Prénom non défini';
            const nom = request.formateur_prenom || 'Nom non défini';

            requestItem.innerHTML = `
                <div class="info">
                    <span class="name">${prenom} ${nom}</span>
                    <span class="email">${request.mail}</span>
                    <span class="date">${formattedDate}</span>
                </div>
                <button class="btn btn-warning" 
                        data-email="${request.mail}" 
                        data-prenom="${prenom}" 
                        data-nom="${nom}">
                    Envoyer Mail de Réinitialisation
                </button>
            `;

            requestsList.appendChild(requestItem);
        });

        attachRequestEvents(); // Attacher les événements aux nouveaux boutons
    }

    // Attacher les événements "click" aux boutons
    function attachRequestEvents() {
        requestsList.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-warning')) {
                handleRequestClick(event.target);
            }
        });
    }

    // Gérer le clic sur un bouton de demande
    function handleRequestClick(button) {
        const email = button.getAttribute('data-email');
        const prenom = button.getAttribute('data-prenom');
        const nom = button.getAttribute('data-nom');
        const newPassword = generateRandomPassword();

        // Remplir le contenu du modal
        modalPrenom.textContent = prenom;
        modalNom.textContent = nom;
        modalPassword.textContent = newPassword;

        // Afficher le modal
        $('#resetPasswordModal').modal('show');

        // Attacher l'événement "Envoyer" au bouton du modal
        sendPasswordBtn.onclick = () => sendResetEmail(email, newPassword);
    }

    // Fonction pour envoyer les identifiants à tous les formateurs
    sendAllIdentifiantsBtn.addEventListener('click', () => {
        fetch('/database/formateurs.json')
            .then(response => response.json())
            .then(data => {
                const formateurs = data.formateurs;

                formateurs.forEach(formateur => {
                    // Vérifier si l'email est défini et non vide
                    if (formateur.mail && formateur.mail.trim() !== '') {
                        sendIdentifiants(formateur.mail, formateur.password, formateur.nom, formateur.prenom);
                    } else {
                        console.log(`Email non défini pour le formateur ${formateur.nom} ${formateur.prenom}`);
                    }
                });

                showPopup("Les identifiants ont été envoyés à tous les formateurs.");
            })
            .catch(error => {
                console.error("Erreur lors de l'envoi des identifiants à tous les formateurs", error);
                alert("Une erreur s'est produite lors de l'envoi des identifiants.");
            });
    });

    // ENVOI DU MAIL DE RÉINITIALISATION ET MISE À JOUR DU MDP
    function sendIdentifiants(email, password, nom, prenom) {
        const message = `Bonjour, 

        
            Soyez le bienvenue dans Gestion Session d'Orion Santé, voici vos informations de connexion : 

            email: ${email}
            mot de passe: ${password}

            Cordialement,
            L'équipe administrative d'Orion Santé
        `;

        fetch('/send-identifiants-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, message })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'success') {
                console.error(`Erreur lors de l'envoi des identifiants à ${email}`);
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi des identifiants :', error);
        });
    }

    // Fonction pour supprimer la demande de la liste
    function removeRequestFromList(email) {
        const requestItem = document.querySelector(`.request-item[data-email="${email}"]`);
        if (requestItem) {
            requestItem.remove(); // Supprimer l'élément de la liste
        }
    }

    // Générer un mot de passe aléatoire
    function generateRandomPassword() {
        const length = 8;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        return Array.from({ length }, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
    }

    // Fonction pour afficher la pop-up
    function showPopup(message) {
        // Créer l'élément du fond gris
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Gris foncé avec transparence
        overlay.style.zIndex = '9998'; // Juste derrière la pop-up
        document.body.appendChild(overlay);

        // Créer l'élément de la pop-up
        const popup = document.createElement('div');
        popup.textContent = message;
        popup.style.position = 'fixed';
        popup.style.top = '50%'; // Centré verticalement
        popup.style.left = '50%'; // Centré horizontalement
        popup.style.transform = 'translate(-50%, -50%)'; // Centrage parfait
        popup.style.backgroundColor = '#ec5b15'; // Couleur de fond orange
        popup.style.color = 'white';
        popup.style.padding = '10px 20px';
        popup.style.borderRadius = '5px';
        popup.style.fontSize = '16px';
        popup.style.zIndex = '9999'; // Au-dessus du fond gris
        popup.style.opacity = '1';
        popup.style.transition = 'opacity 0.5s ease-in-out';

        // Ajouter la pop-up à la page
        document.body.appendChild(popup);

        // Enlever la pop-up et le fond gris après 2 secondes
        setTimeout(() => {
            popup.style.opacity = '0';
            overlay.style.opacity = '0';
            setTimeout(() => {
                popup.remove();
                overlay.remove();
            }, 500); // Après la transition de disparition
        }, 2000);
    }

    function sendResetEmail(email, newPassword) {
        fetch('/send-new-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password: newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Mise à jour du mot de passe dans formateurs.json après l'envoi de l'email
                fetch('/update-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, newPassword })
                })
                .then(response => response.json())
                .then(updateData => {
                    if (updateData.status === 'success') {
                        showPopup("Le mot de passe a été réinitialisé, envoyé par email et mis à jour dans formateurs.json.");
                        removeRequestFromList(email); // Supprimer la demande après envoi
                    }
                });
            } else {
                console.error("Erreur lors de la réinitialisation du mot de passe.");
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi du mot de passe :', error);
        });
    }
    
    
});



// Fonction pour afficher le pop-up
function showPopup(message, link) {



    const popup = document.createElement('div');
    popup.style.backgroundColor = '#ec5b15';
    popup.style.color = '#fff';
    popup.style.padding = '10px 15px';
    popup.style.marginTop = '10px';
    popup.style.borderRadius = '5px';
    popup.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    popup.style.cursor = 'pointer';
    popup.style.transition = 'opacity 0.5s ease-in-out';
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.innerHTML = message;

    // Redirection sur clic
    popup.onclick = () => {
        window.location.href = link;
    };

    // Ajouter le pop-up au conteneur
    document.body.appendChild(popup);

    // Supprimer le pop-up après 5 secondes
    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.remove();
        }, 500);
    }, 5000);
}

// Écoute des événements de modification des coordonnées
socket.on('formateurUpdate', (data) => {
    console.log('Notification reçue côté admin :', data); // Vérifiez si le client reçoit les données
    if (data && data.message) {
        showPopup(data.message, '/admin/addformateur/addform.html');
    }
});