$(document).ready(function() {
    checkAdminAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            initializeThemeFormateurApp();
        } else {
            window.location.href = '/admin/login_admin.html';
        }
    }).catch(error => {
        console.error('Error during authentication check:', error);
        window.location.href = '/admin/login_admin.html';
    });

    $('#searchThemes').on('input', function() {
        const searchValue = $(this).val().toLowerCase();

        // Parcourir tous les éléments de la liste des thèmes
        $('#themes-list .theme-item').each(function() {
            const themeName = $(this).text().toLowerCase();
            // Afficher ou masquer les thèmes en fonction de la recherche
            if (themeName.includes(searchValue)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

// Fonction principale pour initialiser les événements
function initializeDownloadHandlers() {
    // Gestionnaire pour télécharger les thèmes en Excel
    document.getElementById('downloadThemesExcel').addEventListener('click', function () {
        fetchThemesData().then(themesData => {
            generateThemesExcel(themesData);
        }).catch(error => {
            console.error("Erreur lors de la récupération des données :", error);
            alert("Erreur lors de la récupération des thèmes.");
        });
    });

    // Gestionnaire pour télécharger les thèmes en PDF
    document.getElementById('downloadThemesPDF').addEventListener('click', function () {
        fetchThemesData().then(themesData => {
            generateThemesPDF(themesData);
        }).catch(error => {
            console.error("Erreur lors de la récupération des données :", error);
            alert("Erreur lors de la récupération des thèmes.");
        });
    });

    // Gestionnaire pour télécharger les thèmes en JSON
    document.getElementById('downloadThemesJSON').addEventListener('click', function () {
        fetchThemesData().then(themesData => {
            generateThemesJSON(themesData);
        }).catch(error => {
            console.error("Erreur lors de la récupération des données :", error);
            alert("Erreur lors de la récupération des thèmes.");
        });
    });
}

// Fonction pour récupérer les données des thèmes
function fetchThemesData() {
    return fetch('/database/themes.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur HTTP : " + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (!data.themes || data.themes.length === 0) {
                throw new Error("Aucun thème disponible.");
            }
            return data.themes;
        });
}

// Fonction pour générer un fichier Excel
function generateThemesExcel(themesData) {
    const excelData = themesData.map(theme => ({
        "Nom du Thème": theme.name,
        "Type": theme.type,
        "Durée (jours)": theme.duration,
        "Couleur": theme.bck_color
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thèmes");

    XLSX.writeFile(wb, "Themes.xlsx");
}

// Fonction pour générer un fichier PDF
function generateThemesPDF(themesData) {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    doc.text('Liste des Thèmes', 105, 10, { align: 'center' });

    doc.autoTable({
        head: [['Nom du Thème', 'Type', 'Durée (jours)', 'Couleur']],
        body: themesData.map(theme => [
            theme.name || 'Non défini',
            theme.type || 'Non défini',
            theme.duration || 'Non défini',
            theme.bck_color || 'Non défini'
        ]),
        startY: 20
    });

    doc.save('Themes.pdf');
}

// Fonction pour générer un fichier JSON
function generateThemesJSON(themesData) {
    const jsonData = JSON.stringify(themesData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Themes.json";
    link.click();
}

// Appeler la fonction d'initialisation
initializeDownloadHandlers();



    $('#logout-btn').on('click', function() {
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
                console.error('Logout failed');
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
        });
    });
});

function checkAdminAuth() {
    return fetch('/check-auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        return data.authenticated;
    })
    .catch(error => {
        console.error('Error checking admin authentication:', error);
        return false;
    });
}

$(document).ready(function() {
    $.ajax({
        type: 'POST',
        url: '/check-auth',
        contentType: 'application/json',
        success: function(response) {
            if (response.authenticated && response.username === 'Véronique') {
                $('li:contains("Logs de Véronique")').hide();
            }
        },
        error: function() {
            console.error('Erreur lors de la vérification de l\'authentification.');
        }
    });
});

function initializeThemeFormateurApp() {
    let themesData = [], formateursData = [], eventsData = [], adminsData = [];

    fetchData().then(() => {
        loadThemes();
        loadFormateursView();
        setupDynamicScrollbars();

        $('#toggleViewBtn').click(toggleView);

        $('#themes-list').on('click', '.theme-item', function() {
            const themeId = $(this).data('theme-id');
            $('#themes-list .theme-item').removeClass('active');
            $(this).addClass('active');
            openThemeModal(themeId);
        });

        $('#themeModal').on('click', '.remove', function() {
            const formateurId = $(this).data('formateur-id');
            const themeId = $('#themeModal').data('theme-id');
            unassignFormateur(themeId, formateurId);
        });

        $('#saveThemeChanges').click(function() {
            const themeId = $('#themeModal').data('theme-id');
            saveThemeChanges(themeId);
        });

        $('#deleteTheme').click(function() {
            const themeId = $('#themeModal').data('theme-id');
            console.log('ID du thème à supprimer:', themeId);
            if (confirm('Êtes-vous sûr de vouloir supprimer ce thème ? Cette action est irréversible.')) {
                deleteTheme(themeId);
            }
        });

// Gestion du bouton pour générer le PDF de tous les thèmes
$('#generate-themes-pdf-btn').on('click', function () {
    const { jsPDF } = window.jspdf; // Import jsPDF

    if (!themesData || themesData.length === 0) {
        alert('Aucun thème à afficher.');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait', // Mode portrait
        unit: 'mm',
        format: 'a4'
    });

    // Arrière-plan pour le titre
    doc.setFillColor('#ec5b15');
    doc.rect(0, 10, 210, 20, 'F'); // Largeur pleine pour l'en-tête

    // Titre du document
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // Texte blanc
    doc.text('Liste de tous les thèmes', 105, 20, { align: 'center' });

    // Afficher le nombre total de thèmes
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Texte noir
    doc.text(`Nombre total de thèmes : ${themesData.length}`, 10, 40);

    // Ajouter un tableau avec les informations des thèmes
    const tableHeaders = ['Nom', 'Type', 'Durée (jours)', 'Couleur'];
    const tableData = themesData.map(theme => [
        theme.name || 'Non défini',
        theme.type || 'Non défini',
        theme.duration || 'Non défini',
        theme.bck_color || 'Non défini'
    ]);

    // Générer le tableau
    doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 50, // Position du tableau
        theme: 'grid', // Style du tableau
        styles: {
            fontSize: 10, // Taille de police
            cellPadding: 3 // Espacement interne
        },
        headStyles: {
            fillColor: '#ec5b15', // Couleur des en-têtes
            textColor: '#ffffff' // Texte blanc
        }
    });

    // Générer et télécharger le PDF
    doc.save('liste_themes.pdf');
});

        
// Gestion du bouton d'impression dans le modal "Modifier Thème"
$('#themeModal').on('click', '#print-theme-btn', function () {
    const { jsPDF } = window.jspdf; // Import jsPDF

    const themeId = $('#themeModal').data('theme-id');
    const theme = themesData.find(t => t.id === themeId);

    if (!theme) {
        alert('Erreur : Thème non trouvé.');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait', // Mode portrait
        unit: 'mm',
        format: 'a4'
    });

    // Nom du PDF
    const pdfFileName = `${theme.name.replace(/\s+/g, '_')}.pdf`;

    // Arrière-plan pour le titre
    doc.setFillColor('#ec5b15');
    doc.rect(0, 10, 210, 20, 'F'); // Largeur pleine pour l'en-tête

    // Titre du document
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // Texte blanc
    doc.text('Fiche du Thème', 105, 20, { align: 'center' });

    // Remettre le texte en noir
    doc.setTextColor(0, 0, 0);

    // Informations sur le thème
    const fields = [
        `Nom : ${theme.name || 'Non défini'}`,
        `Type : ${theme.type || 'Non défini'}`,
        `Couleur : ${theme.bck_color || 'Non défini'}`,
        `Durée : ${theme.duration || 'Non défini'} jours`
    ];

    let y = 40;
    fields.forEach((field, index) => {
        const bgColor = index % 2 === 0 ? '#f2f2f2' : '#ffffff';
        doc.setFillColor(bgColor);
        doc.rect(10, y - 5, 190, 10, 'F'); // Fond
        doc.text(field, 15, y);
        y += 15;
    });

    // Formateurs assignés
    const assignedFormateurs = formateursData.filter(f => f.themes.includes(themeId));
    if (assignedFormateurs.length > 0) {
        doc.text('Formateurs assignés :', 10, y);
        y += 10;

        assignedFormateurs.forEach((formateur) => {
            doc.setFillColor('#ec5b15'); // Fond orange
            doc.setTextColor(255, 255, 255); // Texte blanc
            doc.rect(10, y - 5, 190, 10, 'F'); // Rectangle pour le fond
            doc.text(`${formateur.nom} ${formateur.prenom}`, 15, y); // Texte du formateur
            y += 15;
        });
    } else {
        doc.setTextColor(0, 0, 0); // Texte noir
        doc.text('Aucun formateur assigné.', 10, y);
    }

    // Générer et sauvegarder le PDF
    doc.save(pdfFileName);
});


        $('#filterType').change(function() {
            const selectedType = $(this).val();
            loadThemes(selectedType);
        });

        $('#addNewThemeBtn').click(function() {
            $('#addThemeModal').modal('show');
        });

        $('#addThemeForm').submit(function(event) {
            event.preventDefault();
            addNewTheme();
        });

        $('#themeModal').on('click', '#assignFormateursBtn', function() {
            openAssignFormateursModal();
        });

        $('#availableFormateurs').on('change', 'input[type="checkbox"]', function() {
            toggleConfirmAssignButton();
        });

        $('#confirmAssignFormateurs').click(function() {
            const themeId = $('#themeModal').data('theme-id');
            assignSelectedFormateurs(themeId);
        });
    }).catch(error => console.error('Error initializing app:', error));

    function fetchData() {
        return Promise.all([
            fetch('/database/themes.json').then(handleErrors).then(response => response.json()),
            fetch('/database/formateurs.json').then(handleErrors).then(response => response.json()),
            fetch('/database/events.json').then(handleErrors).then(response => response.json()),
            fetch('/database/db.json').then(handleErrors).then(response => response.json())
        ])
        .then(([themesJson, formateursJson, eventsJson, adminsJson]) => {
            themesData = themesJson.themes || [];
            formateursData = formateursJson.formateurs || [];
            eventsData = eventsJson.events || [];
            adminsData = adminsJson.admins || [];
        })
        .catch(error => console.error('Error fetching data:', error));
    }

    function handleErrors(response) {
        if (!response.ok) {
            console.error(`Error fetching ${response.url}: ${response.statusText}`);
            throw Error(`HTTP error! Status: ${response.status}`);
        }
        return response;
    }

    function loadThemes(filterType = 'all') {
        const themesList = $('#themes-list');
        themesList.empty();
        themesData.forEach(theme => {
            if (filterType === 'all' || theme.type === filterType) {
                let isDark = isColorDark(theme.bck_color || '#fff');
                let textColor = isDark ? 'white' : 'black';
                const themeItem = $(`<li class="theme-item" data-theme-id="${theme.id}" style="background-color: ${theme.bck_color}; color: ${textColor};">${theme.name}</li>`);
                themesList.append(themeItem);
            }
        });
    }

    function loadFormateursView() {
        const formateursContainer = $('#formateurs-view');
        formateursContainer.empty();

        formateursData.sort((a, b) => {
            const nameA = a.nom.toLowerCase();
            const nameB = b.nom.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        formateursData.forEach(formateur => {
            const formateurColumn = $('<div class="formateur-column"></div>');
            const formateurName = $(`<div class="formateur-name">${formateur.nom} ${formateur.prenom}</div>`);
            formateurColumn.append(formateurName);

            const formateurThemes = themesData.filter(theme => formateur.themes.includes(theme.id));
            formateurThemes.forEach(theme => {
                let isDark = isColorDark(theme.bck_color || '#fff');
                let textColor = isDark ? 'white' : 'black';
                const themeItem = $(`<div class="theme-item" style="background-color: ${theme.bck_color}; color: ${textColor};">${theme.name}</div>`);
                formateurColumn.append(themeItem);
            });

            formateursContainer.append(formateurColumn);
        });
    }

    function setupDynamicScrollbars() {
        $('#formateurs-view').css('overflow', 'auto');
        $('#formateurs-view').css('scrollbar-color', '#ec5b15 #f1f1f1');
        $('#formateurs-view').css('scrollbar-width', 'thin');
    }

    function toggleView() {
        $('#themes-view').toggle();
        $('#formateurs-view').toggle();
    }

    function openThemeModal(themeId) {
        const theme = themesData.find(t => t.id === themeId);
        if (!theme) return;

        $('#themeModal').data('theme-id', themeId);
        $('#themeName').val(theme.name);
        $('#themeType').val(theme.type);
        $('#themeColor').val(theme.bck_color);
        $('#themeDuration').val(theme.duration);

        loadFormateurs(themeId);

        $('#themeModal').modal('show');
    }

    function loadFormateurs(themeId) {
        const assignedFormateursList = $('#assignedFormateurs');
        assignedFormateursList.empty();
        const assignedFormateurs = formateursData.filter(formateur => formateur.themes && formateur.themes.includes(themeId));
        assignedFormateurs.forEach(formateur => {
            const formateurItem = $(`<li>${formateur.nom} ${formateur.prenom} <span class="remove" data-formateur-id="${formateur.id}">❌</span></li>`);
            assignedFormateursList.append(formateurItem);
        });

        const availableFormateursList = $('#availableFormateurs');
        availableFormateursList.empty();
        const availableFormateurs = formateursData.filter(formateur => !formateur.themes || !formateur.themes.includes(themeId));
        availableFormateurs.forEach(formateur => {
            const formateurItem = $(`<li class="formateur-item"><input type="checkbox" data-formateur-id="${formateur.id}"> ${formateur.nom} ${formateur.prenom}</li>`);
            availableFormateursList.append(formateurItem);
        });
    }

    function saveThemeChanges(themeId) {
        const theme = themesData.find(t => t.id === themeId);
        if (!theme) return;

        theme.name = $('#themeName').val();
        theme.type = $('#themeType').val();
        theme.bck_color = $('#themeColor').val();
        theme.duration = $('#themeDuration').val();

        updateJsonData();
        loadThemes($('#filterType').val());
        $('#themeModal').modal('hide');
    }

    function addNewTheme() {
        const name = $('#newThemeName').val();
        const type = $('#newThemeType').val();
        const bck_color = $('#newThemeColor').val();
        const duration = $('#newThemeDuration').val();
    
        const newId = themesData.length > 0 ? Math.max(...themesData.map(theme => theme.id)) + 1 : 1;
    
        const newTheme = {
            id: newId,
            name: name,
            type: type,
            bck_color: bck_color,
            duration: parseInt(duration)
        };
    
        themesData.push(newTheme);
        loadThemes($('#filterType').val());
        $('#addThemeModal').modal('hide');
    
        fetch('/add-theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTheme)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! Status : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Thème ajouté avec succès :', data);
        })
        .catch(error => {
            console.error('Erreur lors de l\'ajout du thème :', error);
        });
    }
    
    function deleteTheme(themeId) {
        console.log('Suppression du thème avec l\'ID:', themeId);
        themesData = themesData.filter(theme => theme.id !== themeId);
        console.log('Thèmes restants après suppression:', themesData);
    
        // Mettre à jour les formateurs associés à ce thème
        formateursData.forEach(formateur => {
            formateur.themes = formateur.themes.filter(id => id !== themeId);
        });
    
        // Supprimer les événements liés à ce thème
        eventsData = eventsData.filter(event => event.theme_id !== themeId);
        console.log('Événements restants après suppression du thème:', eventsData);
    
        // Mettre à jour les données sur le serveur
        updateJsonData();
    
        // Rafraîchir l'affichage des thèmes
        loadThemes($('#filterType').val());
        $('#themeModal').modal('hide');
        alert('Thème supprimé avec succès.');
    }
    

    function openAssignFormateursModal() {
        const themeId = $('#themeModal').data('theme-id');
        if (!themeId) return;
    
        // Vérifiez si le champ de recherche existe déjà
        if (!$('#searchFormateurs').length) {
            const searchFormateurs = $(`
                <input type="text" id="searchFormateurs" placeholder="Rechercher formateur" class="form-control mb-2">
            `);
            $('#assignFormateursModal .modal-body').prepend(searchFormateurs);
    
            // Ajoutez l'événement input uniquement si le champ est créé
            $('#searchFormateurs').on('input', function() {
                const searchText = $(this).val().toLowerCase();
                $('#availableFormateurs li').each(function() {
                    const formateurName = $(this).text().toLowerCase();
                    if (formateurName.includes(searchText)) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            });
        }
    
        const availableFormateursList = $('#availableFormateurs');
        availableFormateursList.empty();
        const availableFormateurs = formateursData.filter(formateur => !formateur.themes || !formateur.themes.includes(themeId));
        availableFormateurs.forEach(formateur => {
            const formateurItem = $(`<li class="formateur-item"><input type="checkbox" data-formateur-id="${formateur.id}"> ${formateur.nom} ${formateur.prenom}</li>`);
            availableFormateursList.append(formateurItem);
        });
    
        toggleConfirmAssignButton();
        $('#assignFormateursModal').modal('show');
    }
    

    function assignSelectedFormateurs(themeId) {
        $('#availableFormateurs input[type="checkbox"]:checked').each(function() {
            const formateurId = $(this).data('formateur-id');
            assignFormateur(themeId, formateurId);
        });
        loadFormateurs(themeId);
        $('#assignFormateursModal').modal('hide');
    }

    function assignFormateur(themeId, formateurId) {
        const formateur = formateursData.find(formateur => formateur.id === formateurId);
        if (formateur && (!formateur.themes || !formateur.themes.includes(themeId))) {
            formateur.themes = formateur.themes || [];
            formateur.themes.push(themeId);
            updateJsonData();
            loadFormateurs(themeId);
        }
    }

    function unassignFormateur(themeId, formateurId) {
        const formateur = formateursData.find(formateur => formateur.id === formateurId);
        if (formateur) {
            formateur.themes = formateur.themes.filter(id => id !== themeId);

            eventsData.forEach(event => {
                if (event.theme_id === themeId) {
                    event.formateur_ids = event.formateur_ids.filter(id => id !== formateurId);
                }
            });

            updateJsonData();
            loadFormateurs(themeId);
        }
    }

    function updateJsonData() {
        fetch('/database/themes.json')
            .then(response => response.json())
            .then(existingThemes => {
                fetch('/database/formateurs.json')
                    .then(response => response.json())
                    .then(existingFormateurs => {
                        fetch('/database/events.json')
                            .then(response => response.json())
                            .then(existingEvents => {
                                fetch('/database/db.json')
                                    .then(response => response.json())
                                    .then(existingAdmins => {
                                        const updatedThemes = existingThemes.themes.map(theme => {
                                            const updatedTheme = themesData.find(t => t.id === theme.id);
                                            return updatedTheme ? updatedTheme : theme;
                                        });

                                        const updatedFormateurs = existingFormateurs.formateurs.map(formateur => {
                                            const updatedFormateur = formateursData.find(f => f.id === formateur.id);
                                            return updatedFormateur ? updatedFormateur : formateur;
                                        });

                                        const updatedEvents = existingEvents.events.map(event => {
                                            const updatedEvent = eventsData.find(e => e.id === event.id);
                                            return updatedEvent ? updatedEvent : event;
                                        });

                                        eventsData.forEach(event => {
                                            if (!existingEvents.events.some(e => e.id === event.id)) {
                                                updatedEvents.push(event);
                                            }
                                        });

                                        const updatedAdmins = existingAdmins.admins.map(admin => {
                                            const updatedAdmin = adminsData.find(a => a.id === admin.id);
                                            return updatedAdmin ? updatedAdmin : admin;
                                        });

                                        const updatedData = {
                                            themes: updatedThemes,
                                            formateurs: updatedFormateurs,
                                            events: updatedEvents,
                                            admins: updatedAdmins
                                        };

                                        return fetch('/update', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify(updatedData)
                                        });
                                    });
                            });
                    });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Update successful:', data);
            })
            .catch(error => {
                console.error('Error updating data:', error);
            });
    }

    function isColorDark(color) {
        let r, g, b;
        if (color.match(/^rgb/)) {
            color = color.match(/rgba?\(([^)]+)\)/)[1];
            color = color.split(/ *, */).map(Number);
            [r, g, b] = color;
        } else if (color[0] === '#') {
            if (color.length === 4) {
                color = color.substr(1).split('').map(function (hex) {
                    return hex + hex;
                }).join('');
            } else {
                color = color.substr(1);
            }
            [r, g, b] = color.match(/.{2}/g).map(hex => parseInt(hex, 16));
        }
        let luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luma < 0.5;
    }

    function toggleConfirmAssignButton() {
        const isChecked = $('#availableFormateurs input[type="checkbox"]:checked').length > 0;
        $('#confirmAssignFormateurs').prop('disabled', !isChecked);
    }


    // Initialiser le client Socket.IO
    const socket = io();

    // Écouter les événements 'notifyAdmin'
    socket.on('notifyAdmin', function(data) {
        console.log('Notification reçue :', data);
        // Afficher le bouton pour rediriger vers acc_admin.html
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
                window.location.href = '../acc_admin.html';
            });
            // Ajouter le bouton au début du container principal de la page
            $('.container').prepend(bouton);
        }
    }
}