$(document).ready(function () {
    // Vérification de l'authentification de l'admin
    checkAdminAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            initializeAddFormateurApp();
        } else {
            window.location.href = '/admin/login_admin.html';
        }
    }).catch(error => {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        window.location.href = '/admin/login_admin.html';
    });

    const socket = io();


    socket.on('notifyAdmin', function(data) {
        console.log('Notification reçue :', data);
        // Afficher le bouton pour rediriger vers acc_admin.html
        afficherBoutonNotification(data);
    });

        // Initialisation de Socket.IO
        
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
   
document.addEventListener("DOMContentLoaded", () => {
    const formateursBadge = document.getElementById("formateurs-badge");
    const ajoutFormateurBadge = document.getElementById("ajout-formateur-badge");

    // Fonction pour mettre à jour les badges
    function updateNavBarBadges() {
        fetch('/database/notifications.json')
            .then(response => response.json())
            .then(data => {
                if (data.notifications && Array.isArray(data.notifications)) {
                    const notificationsCount = data.notifications.length;

                    // Met à jour le badge de "Formateurs"
                    if (notificationsCount > 0) {
                        formateursBadge.style.display = "inline-block";
                        formateursBadge.textContent = notificationsCount;
                    } else {
                        formateursBadge.style.display = "none";
                    }

                    // Filtre uniquement les notifications liées aux ajouts de formateurs
                    const ajoutFormateursCount = data.notifications.filter(
                        notification => notification.type === "update_formateur"
                    ).length;

                    // Met à jour le badge de "Ajout formateur"
                    if (ajoutFormateursCount > 0) {
                        ajoutFormateurBadge.style.display = "inline-block";
                        ajoutFormateurBadge.textContent = ajoutFormateursCount;
                    } else {
                        ajoutFormateurBadge.style.display = "none";
                    }
                }
            })
            .catch(error => {
                console.error("Erreur lors de la récupération des notifications :", error);
            });
    }

    // Appelle la fonction au chargement
    updateNavBarBadges();

    // Met à jour les badges en temps réel via Socket.IO
    const socket = io();
    socket.on("formateurUpdate", () => {
        updateNavBarBadges(); // Recharge les badges quand il y a une mise à jour
    });
});
        
        // Écoute des événements de modification des coordonnées
        socket.on('formateurUpdate', (data) => {
            console.log('Notification reçue côté admin :', data); // Vérifiez si le client reçoit les données
            if (data && data.message) {
                showPopup(data.message, '/admin/addformateur/addform.html');
            }
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
                window.location.href = '../acc_admin.html';
            });
            // Ajouter le bouton au début du container principal de la page
            $('.container').prepend(bouton);
        }
    }
    
// Initialisation des gestionnaires de téléchargement
function initializeDownloadHandlers() {
    document.getElementById('downloadFormateursPDF').addEventListener('click', function () {
        fetchFormateursData().then(formateursData => {
            generateFormateursPDF(formateursData);
        }).catch(error => {
            console.error("Erreur lors de la récupération des données :", error);
            alert("Erreur lors de la récupération des formateurs.");
        });
    });

    document.getElementById('downloadFormateursExcel').addEventListener('click', function () {
        fetchFormateursData().then(formateursData => {
            generateFormateursExcel(formateursData);
        }).catch(error => {
            console.error("Erreur lors de la récupération des données :", error);
            alert("Erreur lors de la récupération des formateurs.");
        });
    });

    document.getElementById('downloadFormateursJSON').addEventListener('click', function () {
        fetchFormateursData().then(formateursData => {
            generateFormateursJSON(formateursData);
        }).catch(error => {
            console.error("Erreur lors de la récupération des données :", error);
            alert("Erreur lors de la récupération des formateurs.");
        });
    });
}

// Fonction pour récupérer les données des formateurs
function fetchFormateursData() {
    return fetch('/database/formateurs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur HTTP : " + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (!data.formateurs || data.formateurs.length === 0) {
                throw new Error("Aucun formateur disponible.");
            }
            return data.formateurs;
        });
}

// Fonction pour générer un fichier PDF des formateurs
function generateFormateursPDF(formateursData) {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    doc.text('Liste des Formateurs', 105, 10, { align: 'center' });

    doc.autoTable({
        head: [['Nom', 'Prénom', 'Ville', 'Code Postal', 'Téléphone', 'Mail']],
        body: formateursData.map(formateur => [
            formateur.nom || 'Non défini',
            formateur.prenom || 'Non défini',
            formateur.ville || 'Non défini',
            formateur.CP || 'Non défini',
            formateur.téléphone || 'Non défini',
            formateur.mail || 'Non défini'
        ]),
        startY: 20
    });

    doc.save('Formateurs.pdf');
}

// Fonction pour générer un fichier Excel des formateurs
function generateFormateursExcel(formateursData) {
    const excelData = formateursData.map(formateur => ({
        "Nom": formateur.nom,
        "Prénom": formateur.prenom,
        "Ville": formateur.ville,
        "Code Postal": formateur.CP,
        "Téléphone": formateur.téléphone,
        "Mail": formateur.mail
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Formateurs");

    XLSX.writeFile(wb, "Formateurs.xlsx");
}

// Fonction pour générer un fichier JSON des formateurs
function generateFormateursJSON(formateursData) {
    const jsonData = JSON.stringify(formateursData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Formateurs.json";
    link.click();
}

// Appeler la fonction pour initialiser les gestionnaires
initializeDownloadHandlers();



    // Gestion de la déconnexion
    $('#logout-btn').on('click', function () {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem('formateur');
                window.location.href = '/admin/login_admin.html';
            } else {
                console.error('Échec de la déconnexion');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
    });

    // Fonction pour vérifier l'authentification admin
    function checkAdminAuth() {
        return fetch('/check-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => data.authenticated)
        .catch(error => {
            console.error('Erreur lors de la vérification de l\'authentification admin:', error);
            return false;
        });
    }


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

    function initializeAddFormateurApp() {
        let themesData = [];
        let formateursData = [];
    
        // Bouton d'impression PDF
        $('#print-formateurs-btn').on('click', function () {
            const { jsPDF } = window.jspdf; // Import jsPDF
        
            const doc = new jsPDF({
                orientation: 'landscape', // Mode paysage
                unit: 'mm', // Millimètres
                format: 'a4' // Format A4
            });
        
            // Vérifier que les données des formateurs sont bien chargées
            if (!formateursData || formateursData.length === 0) {
                alert('Aucun formateur disponible pour l\'impression.');
                return;
            }
        
            // Calculer le nombre total de formateurs
            const totalFormateurs = formateursData.length;
        
            // Ajouter un titre avec le compteur
            doc.setFontSize(18);
            doc.text(`Liste des Formateurs (Total : ${totalFormateurs})`, 10, 20);
        
            // Colonnes du tableau
            const columns = ['Nom', 'Prénom', 'Ville', 'Téléphone', 'Mail'];
        
            // Préparer les données à imprimer
            const tableData = formateursData.map(formateur => [
                formateur.nom || 'Non défini',
                formateur.prenom || 'Non défini',
                formateur.ville || 'Non défini',
                formateur.téléphone || 'Non défini',
                formateur.mail || 'Non défini'
            ]);
        
            // Ajouter la table dans le PDF
            doc.autoTable({
                head: [columns], // En-têtes des colonnes
                body: tableData, // Données
                startY: 30, // Position de la table
                theme: 'striped', // Style du tableau
                styles: {
                    fontSize: 10 // Taille de la police
                },
                headStyles: {
                    fillColor: [236, 91, 21] // Couleur des en-têtes
                },
                margin: { top: 30 } // Marge en haut
            });
        
            // Télécharger le PDF
            doc.save('liste_formateurs.pdf');
        });
        
        // Gestion du bouton d'impression pour un formateur dans le modal
$('#editFormateurModal').on('click', '#print-formateur-btn', function () {
    const { jsPDF } = window.jspdf; // Import jsPDF

    const formateurId = $('#editFormateurModal').data('formateur-id');
    const formateur = formateursData.find(f => f.id === formateurId);

    if (!formateur) {
        alert('Erreur : Formateur non trouvé.');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait', // Mode portrait
        unit: 'mm',
        format: 'a4'
    });

    // Nom du PDF
    const pdfFileName = `${formateur.prenom}_${formateur.nom}.pdf`;

    // Arrière-plan pour le titre
    doc.setFillColor('#ec5b15');
    doc.rect(0, 10, 210, 20, 'F'); // Largeur pleine pour l'en-tête

    // Titre du document
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // Texte blanc
    doc.text('Fiche du Formateur', 105, 20, { align: 'center' });

    // Remettre le texte en noir
    doc.setTextColor(0, 0, 0);

    // Informations du formateur avec un fond pour chaque ligne
    const fields = [
        `Nom : ${formateur.nom || 'Non défini'}`,
        `Prénom : ${formateur.prenom || 'Non défini'}`,
        `Ville : ${formateur.ville || 'Non défini'}`,
        `Code Postal : ${formateur.CP || 'Non défini'}`,
        `Téléphone : ${formateur.téléphone || 'Non défini'}`,
        `Mail : ${formateur.mail || 'Non défini'}`,
        `Adresse : ${formateur.adresse || 'Non défini'}`,
    ];

    let y = 40;
    fields.forEach((field, index) => {
        const bgColor = index % 2 === 0 ? '#f2f2f2' : '#ffffff';
        doc.setFillColor(bgColor);
        doc.rect(10, y - 5, 190, 10, 'F'); // Fond
        doc.text(field, 15, y);
        y += 15;
    });

    // Thèmes assignés avec couleurs
    doc.text('Thèmes :', 10, y);
    y += 10;
    const themes = formateur.themes.map(themeId => {
        const theme = themesData.find(t => t.id === themeId);
        return theme ? { name: theme.name, color: theme.color || '#d3d3d3' } : { name: 'Inconnu', color: '#d3d3d3' };
    });

    themes.forEach((theme, index) => {
        const bgColor = theme.color;
        doc.setFillColor(bgColor);
        doc.setTextColor(255, 255, 255); // Texte blanc
        doc.rect(10, y, 190, 10, 'F'); // Fond du thème
        doc.text(theme.name, 15, y + 7); // Texte
        y += 15;
    });

    // Générer et sauvegarder le PDF
    doc.save(pdfFileName);
});

    
        // Fonction pour récupérer les données des thèmes et formateurs
        function fetchData() {
            return Promise.all([
                fetch('/database/themes.json').then(response => response.json()),
                fetch('/database/formateurs.json').then(response => response.json()),
                fetch('/database/notifications.json').then(response => response.json())
            ])
            .then(([themesJson, formateursJson, notificationsJson]) => {
                themesData = themesJson.themes;
                formateursData = formateursJson.formateurs;
                notificationsData = notificationsJson.notifications; // Charger les notifications
                formateursData.sort((a, b) => a.nom.localeCompare(b.nom)); // Tri alphabétique
                populateThemes();
                loadFormateurs(); // Charger tous les formateurs
                highlightModifiedFormateurs(); // Ajouter la coloration
            })
            .catch(error => console.error('Erreur lors de la récupération des données:', error));
        }
        
        function highlightModifiedFormateurs() {
            fetch('/database/notifications.json')
                .then(response => response.json())
                .then(data => {
                    const notifications = data.notifications;
        
                    // Réinitialiser les styles
                    $('#formateurs-list .formateur-item').css('background', '');
        
                    // Appliquer le style uniquement aux formateurs ayant des notifications
                    notifications
                        .filter(notification => notification.type === 'update_formateur')
                        .forEach(notification => {
                            const formateurId = notification.id_formateur; // Utiliser id_formateur
                            $(`#formateurs-list .formateur-item[data-formateur-id="${formateurId}"]`).css('background', '#ec5b15');
                        });
                })
                .catch(error => console.error('Erreur lors de la récupération des notifications:', error));
        }
        

        
        
        
        // Fonction pour extraire le nom complet du formateur depuis le message
        function extractFormateurName(message) {
            const match = message.match(/formateur\s+([\w\s\(\)]+)\s+a mis/);
            return match ? match[1].trim() : null;
        }
        
        
        function extractFormateurName(message) {
            const match = message.match(/formateur\s+([\w\s]+)\s/);
            return match ? match[1].trim() : null; // Extraire le nom du formateur
        }
        

        // Remplir le menu déroulant des thèmes
        function populateThemes() {
            const themesSelect = $('#themes, #edit-themes');
            themesSelect.empty();
            themesData.forEach(theme => {
                const themeOption = $(`<option value="${theme.id}">${theme.name}</option>`);
                themesSelect.append(themeOption);
            });
        }

        // Charger et afficher la liste des formateurs
        function loadFormateurs(filteredData = formateursData) {
            const formateursList = $('#formateurs-list');
            formateursList.empty();
        
            filteredData.forEach(formateur => {
                const formateurItem = $(`
                    <li class="formateur-item" data-formateur-id="${formateur.id}">
                        ${formateur.nom} ${formateur.prenom} - MDP : ${formateur.password || 'Non défini'}
                        <button class="btn btn-sm btn-secondary copy-password-btn" 
                                data-password="${formateur.password || 'Non défini'}" 
                                style="float: right;">Copier MDP</button>
                    </li>
                `);
                formateursList.append(formateurItem);
            });
        }
        

        // Ouvrir le modal pour ajouter un formateur
        $('#openAddFormateurModal').on('click', function () {
            $('#addFormateurModal').modal('show');
        });

        // Générer un mot de passe aléatoire de 8 caractères
        function generatePassword(length = 8) {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let password = "";
            for (let i = 0; i < length; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        }

        // Générer un mot de passe pour un nouveau formateur
        $('#generatePasswordBtn').on('click', function () {
            const newPassword = generatePassword();
            $('#password').val(newPassword);
        });

// Gestion de l'ajout d'un formateur
$('#add-formateur-form').on('submit', function (event) {
    event.preventDefault();

    // Récupérer les valeurs des champs
    const nom = $('#nom').val() || 'Non défini';
    const prenom = $('#prenom').val() || 'Non défini';
    const ville = $('#ville').val() || 'Non défini';
    const cp = $('#cp').val() || 'Non défini';
    const telephone = $('#telephone').val() || 'Non défini';
    const mail = $('#mail').val() || 'Non défini';
    const adresse = $('#adresse').val() || 'Non défini';
    const themes = $('#themes').val() ? $('#themes').val().map(Number) : [];
    const password = $('#password').val() || generatePassword();

    // Ajouter le formateur même si des champs sont manquants
    addFormateur(nom, prenom, ville, cp, telephone, mail, adresse, themes, password);

    // Réinitialiser le formulaire et fermer le modal
    $('#add-formateur-form')[0].reset();
    $('#addFormateurModal').modal('hide'); // Fermer le modal
});

// Fonction pour ajouter un formateur
function addFormateur(nom, prenom, ville, cp, telephone, mail, adresse, themes, password) {
    const newFormateur = {
        id: getNextFormateurId(),
        nom: nom,
        prenom: prenom,
        ville: ville,
        CP: cp,
        téléphone: telephone,
        mail: mail,
        adresse: adresse,
        themes: themes,
        password: password, // Ajout du mot de passe généré
        indisponibilites: []
    };

    // Ajouter le formateur aux données et mettre à jour l'affichage
    formateursData.push(newFormateur);
    updateJsonData();
    loadFormateurs();
}

        $('#delete-formateur').on('click', function () {
            const formateurId = $('#editFormateurModal').data('formateur-id');
            
            if (confirm('Êtes-vous sûr de vouloir supprimer ce formateur ? Cette action est irréversible.')) {
                deleteFormateur(formateurId);
                $('#editFormateurModal').modal('hide'); // Fermer le modal après la suppression
            }
        });
        
        // Fonction pour supprimer un formateur
        function deleteFormateur(id) {
            // Filtrer le tableau pour exclure le formateur à supprimer
            formateursData = formateursData.filter(f => f.id !== id);
            updateJsonData(); // Mettre à jour les données JSON
            loadFormateurs(); // Recharger la liste des formateurs
        }

        // Fonction pour obtenir l'ID suivant du formateur
        function getNextFormateurId() {
            return formateursData.length > 0 ? Math.max(...formateursData.map(f => f.id)) + 1 : 1;
        }

// Gestion de la sélection d'un formateur pour modification
$('#formateurs-list').on('click', '.formateur-item', function (e) {
    if ($(e.target).hasClass('copy-password-btn')) {
        return; // Ignorer le clic sur le bouton de copie de mot de passe
    }

    const formateurId = $(this).data('formateur-id');
    const formateur = formateursData.find(f => f.id === formateurId);

    if (formateur) {
        // Supprimer la notification associée
        removeNotification(formateurId);

        // Retirer le style orange de mise en évidence
        $(this).css('background', ''); 

        // Ouvrir le modal avec les informations du formateur
        $('#formateur-nom-display').text(`${formateur.nom} ${formateur.prenom}`);
        $('#edit-nom').val(formateur.nom);
        $('#edit-prenom').val(formateur.prenom);
        $('#edit-ville').val(formateur.ville);
        $('#edit-cp').val(formateur.CP);
        $('#edit-telephone').val(formateur.téléphone);
        $('#edit-mail').val(formateur.mail);
        $('#edit-adresse').val(formateur.adresse);
        $('#edit-themes').val(formateur.themes);
        $('#edit-password').val(formateur.password);

        loadIndisponibilites(formateur);

        $('#editFormateurModal').data('formateur-id', formateurId).modal('show');
    }
});


        
function removeNotification(formateurId) {
    const updatedNotifications = notificationsData.filter(
        notification => notification.id_formateur !== formateurId
    );

    fetch('/update-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: updatedNotifications })
    })
        .then(response => {
            if (response.ok) {
                console.log(`Notification supprimée pour le formateur ID ${formateurId}.`);
                notificationsData = updatedNotifications;
            } else {
                console.error('Erreur lors de la suppression de la notification:', response.status, response.statusText);
            }
        })
        .catch(error => console.error('Erreur réseau :', error));
}



        
        

        // Charger et afficher les indisponibilités du formateur
        function loadIndisponibilites(formateur) {
            const indisponibilitesList = $('#indisponibilites-list');
            indisponibilitesList.empty();

            if (formateur.indisponibilites && formateur.indisponibilites.length > 0) {
                formateur.indisponibilites.forEach(indisponibilite => {
                    const listItem = $(`<li class="list-group-item">Du ${indisponibilite.dateDebut} au ${indisponibilite.dateFin}</li>`);
                    indisponibilitesList.append(listItem);
                });
            } else {
                const emptyMessage = $('<li class="list-group-item">Aucune indisponibilité</li>');
                indisponibilitesList.append(emptyMessage);
            }
        }

        // Générer un nouveau mot de passe lors de la modification
        $('#edit-generatePasswordBtn').on('click', function () {
            const newPassword = generatePassword();
            $('#edit-password').val(newPassword);
        });

        // Gestion de la modification d'un formateur
        $('#save-formateur').on('click', function (event) {
            event.preventDefault();
            const formateurId = $('#editFormateurModal').data('formateur-id');
            const nom = $('#edit-nom').val();
            const prenom = $('#edit-prenom').val();
            const ville = $('#edit-ville').val();
            const cp = $('#edit-cp').val();
            const telephone = $('#edit-telephone').val();
            const mail = $('#edit-mail').val();
            const adresse = $('#edit-adresse').val();
            const themes = $('#edit-themes').val().map(Number);
            const password = $('#edit-password').val();

            if (nom && prenom && ville && cp && telephone && mail && adresse && themes.length > 0 && password) {
                updateFormateur(formateurId, nom, prenom, ville, cp, telephone, mail, adresse, themes, password);
                $('#editFormateurModal').modal('hide');
            } else {
                alert('Veuillez remplir tous les champs.');
            }
        });

        // Fonction pour mettre à jour un formateur
        function updateFormateur(id, nom, prenom, ville, cp, telephone, mail, adresse, themes, password) {
            const formateur = formateursData.find(f => f.id === id);
            if (formateur) {
                formateur.nom = nom;
                formateur.prenom = prenom;
                formateur.ville = ville;
                formateur.CP = cp;
                formateur.téléphone = telephone;
                formateur.mail = mail;
                formateur.adresse = adresse;
                formateur.themes = themes;
                formateur.password = password;
                updateJsonData();
                loadFormateurs();
            }
        }

        // Mise à jour des données JSON des formateurs
        function updateJsonData() {
            fetch('/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formateurs: formateursData })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Mise à jour réussie:', data);
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour des données:', error);
            });
        }

        // Fonction pour copier le mot de passe d'un formateur
        $(document).on('click', '.copy-password-btn', function () {
            const password = $(this).data('password');
            if (password === 'Non défini') {
                openCustomDialog("Ce formateur n'a pas de mot de passe. Voulez-vous en générer un ?", true, (confirm) => {
                    if (confirm) {
                        const formateurId = $(this).closest('.formateur-item').data('formateur-id');
                        const newPassword = generatePassword(8);
                        updateFormateurPassword(formateurId, newPassword);
                        openCustomDialog('Nouveau mot de passe généré : ' + newPassword);
                    }
                });
            } else {
                const tempInput = $('<input>');
                $('body').append(tempInput);
                tempInput.val(password).select();
                document.execCommand('copy');
                tempInput.remove();
                openCustomDialog('Mot de passe copié : ' + password);
            }
        });

        // Boîte de dialogue stylisée
        function openCustomDialog(message, confirm = false, callback = null) {
            const dialog = $(`
                <div class="custom-dialog">
                    <div class="dialog-content">
                        <p>${message}</p>
                        ${confirm ? '<button id="confirm-btn" class="btn btn-light">Générer</button>' : ''}
                        <button id="close-btn" class="btn btn-light">Fermer</button>
                    </div>
                </div>
            `);
            
            $('body').append(dialog);
            dialog.fadeIn();
        
            $('#close-btn').on('click', function () {
                dialog.fadeOut(function () {
                    dialog.remove();
                });
            });
        
            if (confirm) {
                $('#confirm-btn').on('click', function () {
                    dialog.fadeOut(function () {
                        dialog.remove();
                        if (callback) callback(true);
                    });
                });
            }
        }

        // Mise à jour du mot de passe d'un formateur sans ouvrir le modal
        function updateFormateurPassword(id, newPassword) {
            const formateur = formateursData.find(f => f.id === id);
            if (formateur) {
                formateur.password = newPassword;
                updateJsonData();
                loadFormateurs();
            }
        }

        // Filtrer les formateurs par lettre
        $('.alphabet-btn').on('click', function () {
            const letter = $(this).data('letter');
            let filteredFormateurs = formateursData;
            if (letter !== 'all') {
                filteredFormateurs = formateursData.filter(f => f.nom.startsWith(letter));
            }
            loadFormateurs(filteredFormateurs);
        });

        // Recherche des formateurs
        $('#search-formateur').on('keyup', function () {
            const searchValue = $(this).val().toLowerCase();
            const filteredFormateurs = formateursData.filter(f => f.nom.toLowerCase().includes(searchValue));
            loadFormateurs(filteredFormateurs);
        });

        // Filtrer les formateurs avec des coordonnées manquantes
        $('#showMissingCoordonnees').on('click', function () {
            $('#missing-filters').show();
            filterMissingFormateurs();
        });

        $('#filter-missing-email').on('click', function () {
            filterMissingFormateurs('email');
        });
        $('#filter-missing-telephone').on('click', function () {
            filterMissingFormateurs('telephone');
        });
        $('#filter-missing-adresse').on('click', function () {
            filterMissingFormateurs('adresse');
        });
        $('#filter-missing-cp').on('click', function () {
            filterMissingFormateurs('CP');
        });
        $('#filter-missing-password').on('click', function () {
            filterMissingFormateurs('password');
        });

        // Filtrer les formateurs en fonction des coordonnées manquantes
        function filterMissingFormateurs(filter = '') {
            const missingFormateurs = formateursData.filter(f => {
                if (filter === 'email') return !f.mail;
                if (filter === 'telephone') return !f.téléphone;
                if (filter === 'adresse') return !f.adresse;
                if (filter === 'CP') return !f.CP;
                if (filter === 'password') return !f.password;
                return !f.mail || !f.téléphone || !f.adresse || !f.CP || !f.password;
            });

            loadFormateurs(missingFormateurs);
        }

        fetchData();
    }
});
