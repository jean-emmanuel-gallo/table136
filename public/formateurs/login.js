document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordLink = document.getElementById('forgotpassword');
    const formContainer = document.querySelector('.form-container');
    const errorMessage = document.getElementById('error-message'); // Récupère le message d'erreur

    // Fonction pour afficher la pop-up
    function showPopup(message) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9998';
        document.body.appendChild(overlay);

        const popup = document.createElement('div');
        popup.textContent = message;
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = '#ec5b15';
        popup.style.color = 'white';
        popup.style.padding = '10px 20px';
        popup.style.borderRadius = '5px';
        popup.style.fontSize = '16px';
        popup.style.zIndex = '9999';
        popup.style.opacity = '1';
        popup.style.transition = 'opacity 0.5s ease-in-out';
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.style.opacity = '0';
            overlay.style.opacity = '0';
            setTimeout(() => {
                popup.remove();
                overlay.remove();
                window.location.href = '/formateurs/login.html';
            }, 500);
        }, 2000);
    }

    // Gérer la soumission du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(loginForm);

            fetch('/login/formateur', {
                method: 'POST',
                body: new URLSearchParams(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    localStorage.setItem('formateur', JSON.stringify(data.formateur));
                    window.location.href = '/formateurs/accueil_formateur.html';
                } else {
                    alert('Nom d\'utilisateur ou mot de passe incorrect');
                }
            })
            .catch(error => {
                console.error('Erreur lors de la connexion du formateur:', error);
                alert('Une erreur s\'est produite lors de la connexion. Veuillez réessayer.');
            });
        });
    }

    // Gérer le clic sur "Mot de passe oublié"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (event) {
            event.preventDefault();

            formContainer.innerHTML = `
                <h2>Réinitialisation du mot de passe</h2>
                <form id="resetPasswordForm">
                    <label for="reset-email">Email:</label>
                    <input type="email" id="reset-email" name="reset-email" required>
                    <br>
                    <span id="error-message" style="color: red; display: none;">Vous avez déjà fait une demande de réinitialisation.</span>
                    <button type="submit">Envoyer la demande</button>
                    <button type="button" id="backToLogin">Retour</button>
                </form>
            `;

            const resetPasswordForm = document.getElementById('resetPasswordForm');
            const backToLoginButton = document.getElementById('backToLogin');
            const errorSpan = document.createElement('span');
            errorSpan.style.color = 'red';
            errorSpan.style.marginLeft = '10px';
            errorSpan.style.display = 'none'; // Cacher au départ
            errorSpan.textContent = 'Vous avez déjà demandé la réinitialisation de votre mot de passe';

            const resetEmailLabel = document.querySelector('label[for="reset-email"]');
            resetEmailLabel.appendChild(errorSpan); // Ajouter l'erreur à droite du label

            if (resetPasswordForm) {
                resetPasswordForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    const email = document.getElementById('reset-email').value.trim(); // On enlève les espaces

                    // Vérifier si l'email existe dans formateurs.json
                    fetch('/database/formateurs.json')  // Récupérer le fichier formateurs.json
                    .then(response => response.json())
                    .then(data => {
                        const formateur = data.formateurs.find(f => f.mail === email);

                        if (formateur) {
                            // Si formateur existe, envoyer la demande de réinitialisation
                            fetch('/check-reset-request', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ email: email })
                            })
                            .then(response => response.json())  // Assure-toi de bien récupérer le JSON ici
                            .then(data => {
                                if (data.status === 'error') {
                                    errorSpan.style.display = 'inline'; // Afficher l'erreur à droite
                                } else {
                                    // Si aucune demande précédente, envoyer une nouvelle demande de réinitialisation
                                    const requestData = {
                                        email: email,
                                        date: new Date().toISOString()
                                    };

                                    // Si le nom et prénom sont disponibles, on les ajoute à la demande
                                    if (formateur.nom && formateur.prenom) {
                                        requestData.formateur_nom = formateur.nom;
                                        requestData.formateur_prenom = formateur.prenom;
                                    }

                                    fetch('/reset-password-request', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(requestData)
                                    })
                                    .then(response => response.json())  // Parser la réponse en JSON
                                    .then(data => {
                                        if (data.status === 'success') {
                                            // Ajouter le formateur dans fp.json
                                            fetch('/database/fp.json')
                                            .then(response => response.json())
                                            .then(fpData => {
                                                const newRequest = {
                                                    mail: email,
                                                    date: new Date().toISOString()
                                                };

                                                // N'ajoute les noms et prénoms que s'ils existent
                                                if (formateur.nom && formateur.prenom) {
                                                    newRequest.formateur_nom = formateur.nom;
                                                    newRequest.formateur_prenom = formateur.prenom;
                                                }

                                                fpData.demandes.push(newRequest);

                                                // Sauvegarder dans fp.json
                                                fetch('/update-fp-json', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify(fpData)
                                                })
                                                .then(() => showPopup('Votre demande a été envoyée avec succès !'))
                                                .catch(error => {
                                                    console.error('Erreur lors de la mise à jour de fp.json:', error);
                                                    alert('Erreur lors de l\'envoi de la demande.');
                                                });
                                            })
                                            .catch(error => {
                                                console.error('Erreur lors de la lecture de fp.json:', error);
                                                alert('Erreur lors de la lecture des demandes.');
                                            });
                                        } else {
                                            alert('Erreur lors de l\'envoi de la demande de réinitialisation: ' + data.message);
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
                                        alert('Une erreur s\'est produite. Veuillez réessayer.');
                                    });
                                }
                            })
                            .catch(error => {
                                console.error('Erreur lors de la vérification de la demande :', error);
                            });
                        } else {
                            alert('Cet email n\'existe pas dans notre base de données.');
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors de la récupération des formateurs :', error);
                        alert('Une erreur s\'est produite lors de la récupération des formateurs.');
                    });
                });
            }

            // Gérer le retour au formulaire de connexion
            if (backToLoginButton) {
                backToLoginButton.addEventListener('click', function () {
                    window.location.reload();
                });
            }
        });
    }
});
