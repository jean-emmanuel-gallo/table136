import { initializeEventModal } from './gestevent.js';

$(function() {

    const socket = io();

    let lastNotification = null; // Pour garder une trace de la dernière notification reçue

    socket.on('notifyAdmin', (data) => {
        if (!data) return;
        console.log('Nouvelle notification reçue :', data);
    
        // Ajoute une notification à l'interface utilisateur
        addNotificationToBell(data);
    
        // Montre un message visuel (exemple : popup)
        showAdminPopup(`Le formateur ${data.formateurName} a ${data.status} l'événement prévu le ${data.eventDate}.`);
    });

    

    socket.on('notifyAdminPopup', (data) => {
        console.log('Notification Popup :', data);
        alert(`Notification : ${data.message}`);
    });
    
    socket.on('notifyAdminRefresh', (data) => {
        console.log('Notification Refresh reçue :', data);
    
        // Afficher le bouton de rafraîchissement
        const refreshBtn = $('#refresh-btn');
        refreshBtn.show();
    
        // Incrémenter un compteur ou ajouter une notification (optionnel)
        incrementRefreshCount();
    
        // Ajouter un gestionnaire pour le clic sur le bouton
        refreshBtn.off('click').on('click', function () {
            // Réinitialiser le compteur
            $('#refresh-count').text('0');
            $(this).hide(); // Cacher le bouton
    
            // Rafraîchir la page
            location.reload();
        });
    });
    


    function incrementRefreshCount() {
        const refreshCount = $('#refresh-count');
        const refreshBtn = $('#refresh-btn');
    
        let currentCount = parseInt(refreshCount.text(), 10) || 0;
        refreshCount.text(currentCount + 1);
        refreshBtn.show();
    }
    
    

    $(document).ready(function() {
        // Vérifier l'authentification
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
    
        // Si une valeur de compteur est stockée, l'utiliser, sinon le remettre à zéro
        let refreshCount = sessionStorage.getItem('refresh-count');
        $('#refresh-count').text(refreshCount ? refreshCount : '0');
    });
    
    const refreshBtn = $('#refresh-btn');

    // Cacher le bouton au départ
    refreshBtn.hide();

    // Ajouter un gestionnaire d'événements
    refreshBtn.on('click', function() {
        // Réinitialiser le compteur
        $('#refresh-count').text('0');

        // Cacher le bouton
        refreshBtn.hide();

        // Recharger la page
        location.reload();
    });
    

    
    

    

function addNotificationToBell(data) {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) {
        console.error('Liste des notifications introuvable.');
        return;
    }

    const notificationItem = document.createElement('li');
    notificationItem.classList.add('list-group-item');
    notificationItem.textContent = `Le formateur ${data.formateurName} a ${data.status} l'événement prévu le ${data.eventDate}.`;

    notificationsList.appendChild(notificationItem);

}

    
    
    $(function () {
        const { jsPDF } = window.jspdf; // Importer l'objet jsPDF
    
        // Fonction pour extraire les données filtrées du tableau
        function getFilteredTableData() {
            const tableData = [];
            const showSession = $('#filter-session').is(':checked');
    
            // Parcourir chaque ligne du tableau
            $('#myTable tr').each(function () {
                const row = [];
                const cells = $(this).find('td');
    
                // Ajouter les colonnes visibles selon les filtres
                if (showSession) row.push(cells.eq(10).text()); // Session

                
                // Ajouter les colonnes principales
                row.push(cells.eq(0).text()); // Thème(s)
                row.push(cells.eq(1).text()); // Début
                row.push(cells.eq(2).text()); // Fin
                row.push(cells.eq(3).text()); // Ville
                row.push(cells.eq(5).text()); // Financement
                row.push(cells.eq(6).text()); // Méthode
                row.push(cells.eq(8).text()); // Formateur
                row.push(cells.eq(9).text()); // Choix
    
                // Ajouter la ligne au tableau des données
                if (row.length > 0) tableData.push(row);
            });
    
            console.log('Données extraites pour le PDF :', tableData); // Debugging
            return tableData;
        }
    
        // Fonction pour générer et télécharger le PDF
        $('#print-events-btn').on('click', function () {
            const doc = new jsPDF({
                orientation: 'landscape', // Paysage
                unit: 'mm', // Millimètres
                format: 'a4' // Format A4
            });
    
            // Ajouter un titre au PDF
            doc.setFontSize(18);
            doc.text('Liste des Événements', 10, 20);
    
            // Extraire les données filtrées
            const tableData = getFilteredTableData();
    
            // Vérifier si des données existent
            if (tableData.length === 0) {
                alert('Aucune donnée à afficher dans le PDF.');
                return;
            }
    
            // Colonnes du tableau (ajuster selon les besoins)
            const columns = ['Session', 'Hôtel', 'Thème(s)', 'Début', 'Fin', 'Ville', 'Financement', 'Méthode', 'Formateur', 'Choix'];
    
            // Ajouter la table dans le PDF
            doc.autoTable({
                head: [columns], // En-têtes
                body: tableData, // Données du tableau
                startY: 30, // Position de départ
                theme: 'striped', // Style (striped, grid, plain)
                styles: {
                    fontSize: 10 // Taille de police des cellules
                },
                headStyles: {
                    fillColor: [236, 91, 21] // Couleur des en-têtes
                },
                margin: { top: 30 } // Marge au-dessus
            });
    
            // Générer et télécharger le fichier PDF
            doc.save('evenements.pdf');
        });
    
        // Style pour cacher les boutons d'ajout lors de l'impression
        const printStyle = `
            @media print {
                .add-formateur-btn {
                    display: none !important; /* Cacher le bouton lors de l'impression */
                }
            }
        `;
    
        // Ajouter le style au DOM
        $('head').append(`<style>${printStyle}</style>`);
    });
    
    
    socket.on('formateurUpdated', (data) => {
        // Afficher une notification dynamique
        showAdminPopup(`${data.prenom} ${data.nom} a modifié ses coordonnées.`);
    });
    
    socket.on('notifyAdmin', (data) => {
        $('#refresh-btn').show(); // Montre le bouton
        incrementRefreshCount();  // Incrémente le compteur
    });
    
    // Gestion du clic sur le bouton
    $('#refresh-btn').on('click', function () {
        $('#refresh-count').text('0'); // Réinitialiser le compteur
        $(this).hide();               // Cacher le bouton
        location.reload();            // Recharger la page
    });
    

    
    // Initialiser le compteur de notifications
let formateurNotificationsCount = 0;

// Écouter les modifications des formateurs via Socket.IO
socket.on('formateurUpdated', (data) => {
    // Incrémenter le compteur global des notifications
    formateurNotificationsCount++;
    updateFormateurNotificationBadges();

    // Afficher une notification popup (optionnel)
    showAdminPopup(`${data.prenom} ${data.nom} a modifié ses coordonnées.`);
});

function showAdminPopup(message) {
    const popup = $('<div class="admin-popup"></div>').text(message);
    $('body').append(popup);

    // Style de la popup
    popup.css({
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#ec5b15",
        color: "#fff",
        padding: "10px",
        borderRadius: "5px",
        zIndex: 1000
    });

    // Disparaît après 5 secondes
    setTimeout(() => popup.fadeOut(500, () => popup.remove()), 5000);
}


// Fonction pour mettre à jour les badges
function updateFormateurNotificationBadges() {
    const mainBadge = $('#formateurs-badge');
    const ajoutBadge = $('#ajout-formateur-badge');

    if (formateurNotificationsCount > 0) {
        // Mettre à jour les badges
        mainBadge.text(formateurNotificationsCount).show();
        ajoutBadge.text(formateurNotificationsCount).show();
    } else {
        // Cacher les badges s'il n'y a pas de notifications
        mainBadge.hide();
        ajoutBadge.hide();
    }
}

// Réinitialiser le compteur lorsque "Ajout formateur" est cliqué
$('#ajout-formateur-badge').parent().on('click', function () {
    formateurNotificationsCount = 0;
    updateFormateurNotificationBadges();
});


    function updateFormateursJson() {
        return fetch('/database/formateurs.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Erreur HTTP ! Statut : ${res.status}`);
                }
                return res.json();
            })
            .then(formateursDataFromDb => {
                formateursDataFromDb.formateurs = Object.values(formateursData);
    
                return fetch('/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formateursDataFromDb)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Formateurs mis à jour avec succès :", data.message);
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour du fichier formateurs.json :', error);
            });
    }
    
    
    
    checkAdminAuth();

    function checkAdminAuth() {
        $.ajax({
            type: 'POST',
            url: '/check-auth',
            contentType: 'application/json',
            success: function(response) {
                if (response.authenticated) {
                    console.log(`Bonjour ${response.username}`);
                    // Si l'utilisateur est Véronique, cacher l'élément "Logs Administrateur"
                    if (response.username === 'Véronique') {
                        $('#admin-logs').hide(); // Cacher "Logs Administrateur"
                    }
                    initializeApp();
                } else {
                    alert('Authentification échouée. Veuillez vous connecter.');
                    window.location.href = '/admin/login_admin.html';
                }
            },
            error: function() {
                alert('Erreur de serveur. Veuillez réessayer plus tard.');
            }
        });
    }

    $('#filter-session, #filter-constel, #filter-remarque').change(function() {
        updateTableColumns();
    });

    function updateTableColumns() {
        // État des cases à cocher
        const showSession = $('#filter-session').is(':checked');
        const showConstel = $('#filter-constel').is(':checked');
        const showRemarque = $('#filter-remarque').is(':checked');
    
        // Indices des colonnes (commençant à 1 pour nth-child)
        const columnIndexes = {
            session: 10,   // Index de la colonne Session
            constel: 11,   // Index de la colonne Constel/DPC
            remarque: 7    // Index de la colonne Remarque
        };
    
        // Gérer chaque colonne
        toggleColumn(columnIndexes.session, showSession);
        toggleColumn(columnIndexes.constel, showConstel);
        toggleColumn(columnIndexes.remarque, showRemarque);
    }
    
    function toggleColumn(columnIndex, isVisible) {
        const columnSelector = `th:nth-child(${columnIndex}), td:nth-child(${columnIndex})`;
    
        if (isVisible) {
            $(columnSelector).show(); // Afficher la colonne
        } else {
            $(columnSelector).hide(); // Masquer la colonne
        }
    }
    
    // Écouter les changements sur les cases à cocher
    $('#filter-session, #filter-constel, #filter-remarque').change(updateTableColumns);
    
    // Initialiser les colonnes au chargement de la page
    $(document).ready(() => {
        updateTableColumns();
    });
    

    $('#filter-session, #filter-constel, #filter-remarque').change(updateTableColumns);

    
    function toggleColumn(columnIndex, isVisible) {
        // Sélecteur pour <th> et <td> correspondant à la colonne
        const columnSelector = `th:nth-child(${columnIndex}), td:nth-child(${columnIndex})`;
        if (isVisible) {
            $(columnSelector).show(); // Afficher
        } else {
            $(columnSelector).hide(); // Masquer
        }
    }
    
    
    
    function toggleColumnByClass(className, shouldShow) {
        // Afficher ou masquer les cellules avec la classe spécifique
        $(`.${className}`).toggle(shouldShow);
    
        // Afficher ou masquer les en-têtes associés
        $(`th.${className}`).toggle(shouldShow);
    }
    
    
    
    function handleColumnVisibility(columnIndex, shouldShow) {
        const columnNumber = columnIndex + 1; // Les indices commencent à 1 pour nth-child
    
        if (shouldShow) {
            // Réafficher la colonne si elle est cachée
            $('th[data-col-index="' + columnIndex + '"]').show();
            $('#myTable tr').each(function () {
                $(this).find('td:nth-child(' + columnNumber + ')').show();
            });
        } else {
            // Supprimer le <th> et les <td> correspondants
            $('th:nth-child(' + columnNumber + ')').remove();
            $('#myTable tr').each(function () {
                $(this).find('td:nth-child(' + columnNumber + ')').remove();
            });
        }
    }
    
    
    $('#filter-session, #filter-constel, #filter-remarque').change(function() {
        updateTableColumns();
    });
    
    

    function updateFormateurStatus(eventId, formateurId, status) {
        // Mettre à jour le statut dans les données
        const eventIndex = eventsArray.findIndex(event => event.id === eventId);
        if (eventIndex !== -1) {
            eventsArray[eventIndex].formateur_status[formateurId] = status;
        }
    
        // Émettre une notification via Socket.IO
        socket.emit('notifyAdmin', {
            formateurName: formateursData[formateurId].nom + ' ' + formateursData[formateurId].prenom,
            status: status,
            eventDate: new Date(eventsArray[eventIndex].date_debut.split('/').reverse().join('-')).toLocaleDateString('fr-FR')
        });
    
        // Mettre à jour le JSON si nécessaire
        updateJsonData();
    }
    

    function initializeApp() {
        let eventsArray = [];
        let themesData = {};
        let formateursData = {};
        let lastEventId = 0;
        let currentYear = new Date().getFullYear();
        let currentMonth = 'all';

        fetchJsonData();
        $(".datepicker").datepicker({ dateFormat: "dd/mm/yy" });

        updateNavigation();

        function updateNavigation() {
            $('#current-year').text(currentYear);
            $('#current-month').text(currentMonth === 'all' ? 'Tous' : new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }));
            renderMonthButtons();
            updateEventsSansFormateursAlert();
            updateRefusedEventsAlert();
            updateCancellationRequestsAlert();
        }


        
        $('#prev-year-btn').on('click', function() {
            currentYear--;
            buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
            updateNavigation();
            updateEventsSansFormateursAlert();
            updateRefusedEventsAlert();
        });

        $('#next-year-btn').on('click', function() {
            currentYear++;
            buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
            updateNavigation();
            updateEventsSansFormateursAlert();
            updateRefusedEventsAlert();
        });

        $('#prev-month-btn').on('click', function() {
            if (currentMonth === 1) {
                currentMonth = 12;
                currentYear--;
            } else {
                currentMonth--;
            }
            buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
            updateNavigation();
        });

        $('#next-month-btn').on('click', function() {
            if (currentMonth === 12) {
                currentMonth = 1;
                currentYear++;
            } else {
                currentMonth++;
            }
            buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
            updateNavigation();
            updateEventsSansFormateursAlert();
            updateRefusedEventsAlert();
        });

        $('#cancel-requests-btn').on('click', function() {
            let cancellationRequests = eventsArray.filter(event => {
                return Object.values(event.formateur_status || {}).includes('pending-cancel');
            });
            buildTable(cancellationRequests);
        });

        

        function updateCancellationRequestsAlert() {
            let count = eventsArray.filter(event => {
                return Object.values(event.formateur_status || {}).includes('pending-cancel');
            }).length;
            $('#cancel-requests-btn').text(`${count} demandes d'annulation`);
        }

        function renderMonthButtons() {
            let monthsContainer = $('#months-container');
            monthsContainer.empty();

            let hasYearEvents = eventsArray.some(event => {
                let [day, monthStr, yearStr] = event.date_debut.split('/');
                return parseInt(yearStr) === currentYear;
            });

            let allEventsButton = $(`<button class="month-btn ${hasYearEvents ? 'has-events' : ''}" data-month="all">Tous</button>`);
            allEventsButton.on('click', function() {
                currentMonth = 'all';
                buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
                updateNavigation();
            });
            monthsContainer.append(allEventsButton);

            for (let month = 1; month <= 12; month++) {
                let monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' });
                let hasEvents = eventsArray.some(event => {
                    let [day, monthStr, yearStr] = event.date_debut.split('/');
                    return parseInt(yearStr) === currentYear && parseInt(monthStr) === month;
                });

                let monthButton = $(`<button class="month-btn ${hasEvents ? 'has-events' : ''}" data-month="${month}">${monthName.substring(0, 3)}</button>`);
                monthButton.on('click', function() {
                    currentMonth = $(this).data('month');
                    buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
                    updateNavigation();
                    updateEventsSansFormateursAlert();
                    updateRefusedEventsAlert();
                });
                monthsContainer.append(monthButton);
            }
        }

        function filterByYearAndMonth(events, year, month) {
            if (month === 'all') {
                return events.filter(event => {
                    let [day, monthStr, yearStr] = event.date_debut.split('/');
                    return parseInt(yearStr) === year;
                });
            }
            return events.filter(event => {
                let [day, monthStr, yearStr] = event.date_debut.split('/');
                return parseInt(yearStr) === year && parseInt(monthStr) === month;
            });
        }

        $('#new-date-debut').on('change', function() {
            let startDate = $(this).datepicker('getDate');
            if (startDate) {
                let selectedThemeName = $('#new-theme').val();
                let selectedTheme = Object.values(themesData).find(theme => theme.name === selectedThemeName);
                let endDate = new Date(startDate.getTime());
        
                if (selectedTheme) {
                    // Vérifier si le thème a une durée de 2 jours
                    let duration = parseInt(selectedTheme.duration, 10);
                    if (duration === 2) {
                        endDate.setDate(startDate.getDate() + 1); // Ajoute un jour pour faire un événement de 2 jours
                    } else {
                        // Par défaut, l'événement est d'un jour
                        endDate.setDate(startDate.getDate());
                    }
        
                    // Formater la date pour l'affichage (dd/mm/yyyy)
                    let formattedEndDate = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}`;
                    $('#new-date-fin').val(formattedEndDate);
                }
            }
        });
        

        $('#new-theme, #new-date-debut, #new-date-fin').on('change', function() {
            let selectedThemeName = $('#new-theme').val();
            let selectedTheme = Object.values(themesData).find(theme => theme.name === selectedThemeName);
            let startDate = $('#new-date-debut').datepicker('getDate');
            let endDate = $('#new-date-fin').datepicker('getDate');
        
            if (selectedTheme && startDate && endDate) {
                // Récupérer les formateurs disponibles
                let availableFormateurs = getAvailableFormateurs(selectedTheme.id, startDate, endDate);
                populateFormateursDropdown(availableFormateurs);
                $('#new-forma').prop('disabled', false);
            } else {
                $('#new-forma').prop('disabled', true); // Désactive si les conditions ne sont pas remplies
            }
        });
        
        




        function isFormateurAvailableForDates(formateurId, newStartDate, newEndDate, newEventType) {
            const formateur = formateursData[formateurId];
        
            // 1. Vérification des indisponibilités
            if (formateur.indisponibilites) {
                for (let indisponibilite of formateur.indisponibilites) {
                    let indisponibiliteStart = new Date(indisponibilite.dateDebut.split('/').reverse().join('-'));
                    let indisponibiliteEnd = new Date(indisponibilite.dateFin.split('/').reverse().join('-'));
        
                    if (
                        (newStartDate <= indisponibiliteEnd && newStartDate >= indisponibiliteStart) ||
                        (newEndDate <= indisponibiliteEnd && newEndDate >= indisponibiliteStart) ||
                        (newStartDate <= indisponibiliteStart && newEndDate >= indisponibiliteEnd)
                    ) {
                        // Ignorer les indisponibilités pour les événements en soirée
                        if (newEventType === "soirée") continue;
        
                        return false; // Indisponible
                    }
                }
            }
        
            // 2. Vérification des conflits avec d'autres événements
            for (let existingEvent of eventsArray) {
                if (existingEvent.formateur_ids && existingEvent.formateur_ids.includes(formateurId)) {
                    let eventStartDate = new Date(existingEvent.date_debut.split('/').reverse().join('-'));
                    let eventEndDate = new Date(existingEvent.date_fin.split('/').reverse().join('-'));
        
                    // Ignorer les conflits pour les événements de type "soirée"
                    if (
                        newEventType === "soirée" &&
                        existingEvent.methode !== "soirée" &&
                        newStartDate.toDateString() === eventStartDate.toDateString()
                    ) {
                        continue;
                    }
        
                    // Détecter les conflits standards
                    if (
                        (newStartDate <= eventEndDate && newStartDate >= eventStartDate) ||
                        (newEndDate <= eventEndDate && newEndDate >= eventStartDate) ||
                        (newStartDate <= eventStartDate && newEndDate >= eventEndDate)
                    ) {
                        return false; // Conflit détecté
                    }
                }
            }
        
            return true; // Disponible si aucun conflit trouvé
        }
        
        
        
        
        $('#apply-advanced-filters').on('click', function() {
            let themeValue = $('#filter-theme').val().toLowerCase();
            let formateurValue = $('#filter-formateur').val().toLowerCase();
            let villeValue = $('#filter-ville').val().toLowerCase();
            let methodeValue = $('#filter-methode').val();
            let dateDebutValue = $('#filter-date-debut').datepicker('getDate');
            let dateFinValue = $('#filter-date-fin').datepicker('getDate');
            let numSessionValue = $('#filter-num-session').val().toLowerCase();
            let choixValue = $('#filter-choix').val().toLowerCase();
        
            // Filtrer les événements selon les critères sélectionnés
            let filteredEvents = eventsArray.filter(event => {
                let themeMatch = !themeValue || themesData[event.theme_id]?.name.toLowerCase().includes(themeValue);
                let formateurMatch = !formateurValue || event.formateur_ids.some(id => {
                    let formateur = formateursData[id];
                    // Vérifier si le formateur est défini avant de vérifier son nom
                    return formateur && `${formateur.nom} ${formateur.prenom}`.toLowerCase().includes(formateurValue);
                });
                let villeMatch = !villeValue || event.ville.toLowerCase().includes(villeValue);
                let methodeMatch = !methodeValue || event.methode === methodeValue;
                let numSessionMatch = !numSessionValue || event.num_s.toString().toLowerCase().includes(numSessionValue);
                let choixMatch = !choixValue || event.choix?.toLowerCase() === choixValue;
        
                // Vérification des dates
                let dateDebutMatch = !dateDebutValue || new Date(event.date_debut.split('/').reverse().join('-')) >= dateDebutValue;
                let dateFinMatch = !dateFinValue || new Date(event.date_fin.split('/').reverse().join('-')) <= dateFinValue;
        
                return themeMatch && formateurMatch && villeMatch && methodeMatch && numSessionMatch && choixMatch && dateDebutMatch && dateFinMatch;
            });
        
            // Reconstruire le tableau avec les événements filtrés
            buildTable(filteredEvents);
        });
        
        

        $('#new-theme').on('change', function() {
            let selectedThemeName = $(this).val();
            let selectedTheme = Object.values(themesData).find(theme => theme.name === selectedThemeName);
            
            if (selectedTheme) {
                // Remplir le champ financement
                $('#new-finan').val(selectedTheme.type);
        
                // Récupérer les formateurs assignés à ce thème
                let assignedFormateurs = getAssignedFormateursForTheme(selectedTheme.id);
        
                // Mettre à jour la liste déroulante des formateurs
                populateFormateursDropdown(assignedFormateurs);
            }
        });
        
        // Fonction pour obtenir les formateurs assignés à un thème
        function getAssignedFormateursForTheme(themeId) {
            // Filtre les formateurs qui sont assignés au thème
            return Object.values(formateursData).filter(formateur => 
                formateur.themes.includes(themeId)
            );
        }
        
        function getAvailableFormateurs(themeId, startDate, endDate, eventType) {
            return Object.values(formateursData).filter(formateur => {
                // 1. Vérifier si le formateur est assigné au thème
                const isAssignedToTheme = isFormateurAssignedToTheme(formateur, themeId);
        
                // 2. Vérifier la disponibilité du formateur pour les dates et l'événement
                const isAvailable = isFormateurAvailableForDates(formateur.id, startDate, endDate, eventType);
        
                // 3. S'assurer que le formateur n'est pas dans la liste des non-assignables pour cet événement
                const isNotInNonAssignable = !eventsArray.some(event =>
                    event.nonAssignableFormateurs &&
                    event.nonAssignableFormateurs.includes(formateur.id)
                );
        
                // FORCER L'ID 25 à être ajouté pour les événements de type "soirée"
                if (formateur.id === 25 && eventType === "soirée") {
                    console.log(`Forçage du formateur ID 25 pour l'événement de type soirée.`);
                    return true;
                }
        
                // Retourner les critères normaux
                return isAssignedToTheme && isAvailable && isNotInNonAssignable;
            });
        }
        

        

        // Fonction pour peupler la liste déroulante des formateurs
        function populateFormateursDropdown(formateurs) {
            let formateursDropdown = $('#new-forma');
            formateursDropdown.empty(); // Vider la liste actuelle
        
            // Trier les formateurs par ordre alphabétique
            formateurs.sort((a, b) => {
                const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
        
            // Ajouter une option par défaut
            formateursDropdown.append('<option value="">Sélectionner un formateur</option>');
        
            // Ajouter les formateurs triés dans le dropdown
            formateurs.forEach(formateur => {
                formateursDropdown.append(`<option value="${formateur.id}">${formateur.nom} ${formateur.prenom}</option>`);
            });
        }
        
        
        

        function attachRowClickEvents() {
            $('.event-row').off('click').on('click', function() {
                let eventId = $(this).data('event-id');
                initializeEventModal(eventId, eventsArray, themesData, formateursData, updateJsonData, buildTable);
                $('#eventModal').modal('show');
            });

            $('.add-formateur-btn').off('click').on('click', function(event) {
                event.stopPropagation();
                let eventId = $(this).data('event-id');
                openAssignFormateurModal(eventId);
            });

            $('.remove-formateur-btn').on('click', function(event) {
                event.stopPropagation();
                let eventId = $(this).data('event-id');
                let formateurId = $(this).data('formateur-id');
            
                console.log('Tentative de suppression - Event ID:', eventId, 'Formateur ID:', formateurId);
            
                let eventIndex = eventsArray.findIndex(event => event.id == eventId);
                if (eventIndex === -1) {
                    console.error(`Événement non trouvé pour l'ID : ${eventId}`);
                    return;
                }
            
                // Suppression du formateur
                const initialLength = eventsArray[eventIndex].formateur_ids.length; // Conserver la longueur initiale
                eventsArray[eventIndex].formateur_ids = eventsArray[eventIndex].formateur_ids.filter(id => id !== parseInt(formateurId));
            
                // Vérification si un formateur a été supprimé
                if (eventsArray[eventIndex].formateur_ids.length < initialLength) {
                    console.log('Formateur supprimé avec succès');
            
                    // Mettre le formateur en nonAssignable pour cet événement
                    if (!eventsArray[eventIndex].nonAssignableFormateurs) {
                        eventsArray[eventIndex].nonAssignableFormateurs = [];
                    }
                    eventsArray[eventIndex].nonAssignableFormateurs.push(parseInt(formateurId));
                } else {
                    console.log('Aucun formateur n\'a été supprimé. Vérifiez l\'ID.');
                    return; // Si aucun formateur n'a été supprimé, on sort
                }
            
                // Mettre à jour les statuts des formateurs
                for (let id in eventsArray[eventIndex].formateur_status) {
                    if (!eventsArray[eventIndex].formateur_ids.includes(parseInt(id))) {
                        delete eventsArray[eventIndex].formateur_status[id];
                    }
                }
            
                // Vérifiez si l'événement a encore des formateurs assignés
                if (eventsArray[eventIndex].formateur_ids.length === 0) {
                    eventsArray[eventIndex].choix = "En attente"; // Remettre l'état à "En attente"
                }
            
                // Mettez à jour le JSON et reconstruire la table
                updateJsonData().then(() => {
                    console.log('Données mises à jour avec succès.');
                    buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
                    updateEventsSansFormateursAlert();
                    updateRefusedEventsAlert(); // Ajout de cette ligne pour mettre à jour le compteur des événements refusés
                    updateCancellationRequestsAlert();
                }).catch(error => {
                    console.error('Erreur lors de la mise à jour des données:', error);
                });
            });
            
            
            
            

            $('.remarque-cell').off('click').on('click', function(event) {
                event.stopPropagation();
            });

            $('.constel-checkbox, .dpc-checkbox').off('click').on('click', function(event) {
                event.stopPropagation();
            });

            $(document).on('click', function(event) {
                if (!$(event.target).closest('#formateurs-list-container, .add-formateur-btn').length) {
                    $('#formateurs-list-container').hide();
                }
            });

            $(document).on('keydown', function(event) {
                if (event.key === 'Escape') {
                    $('#formateurs-list-container').hide();
                }
            });
        }

        function openAssignFormateurModal(eventId) {
            // Trouver l'événement correspondant
            const event = eventsArray.find(event => event.id == eventId);
            if (!event) {
                console.error(`Événement introuvable avec l'ID : ${eventId}`);
                alert("Événement introuvable !");
                return;
            }
        
            // Ajouter dynamiquement l'ID de l'événement au modal
            const modal = $('#selectFormateursModal');
            modal.data('event-id', eventId); // Stocker l'ID de l'événement
        
            // Peupler les formateurs déjà assignés
            populateFormateursCheckboxes(event);
        
            // Ajouter un bouton pour ouvrir le sous-modal
            const modalFooter = modal.find('.modal-footer'); // Cible le footer du modal principal
            modalFooter.find('.open-non-assigned-modal').remove(); // Évite les doublons
        
            const openNonAssignedButton = $('<button>')
                .text('Formateurs non assignés')
                .addClass('btn btn-secondary open-non-assigned-modal')
                .on('click', function () {
                    openNonAssignedFormateursModal(); // Ouvre le sous-modal dynamique (récupère l'ID du modal principal)
                });
        
            modalFooter.append(openNonAssignedButton); // Ajoute le bouton dans le footer du modal principal
        
            // Afficher le modal principal
            modal.modal('show');
        }
        
        

// Fonction pour peupler les cases à cocher des formateurs
function populateFormateursCheckboxes(event) {
    let formateursList = $('#formateurs-list-checkboxes');
    formateursList.empty();

    let selectedFormateurs = event.formateur_ids || [];
    let nonAssignableFormateurs = event.nonAssignableFormateurs || [];

    // Récupérer les dates de l'événement
    let startDate = new Date(event.date_debut.split('/').reverse().join('-'));
    let endDate = new Date(event.date_fin.split('/').reverse().join('-'));

    for (let formateur of Object.values(formateursData)) {
        try {
            // Vérifier si le formateur est assigné au thème
            const isAssignedToTheme = isFormateurAssignedToTheme(formateur, event.theme_id);
            if (!isAssignedToTheme) {
                console.log(`Formateur ${formateur.id} non assigné au thème.`);
                continue;
            }

            // Vérifier la disponibilité du formateur pour les dates
            const isAvailable = isFormateurAvailableForDates(formateur.id, startDate, endDate, event.methode);
            if (!isAvailable) {
                console.log(`Formateur ${formateur.id} non disponible pour les dates.`);
                continue;
            }

            // Vérifier si le formateur est non assignable pour cet événement
            const isNonAssignable = nonAssignableFormateurs.includes(formateur.id);
            if (isNonAssignable) {
                console.log(`Formateur ${formateur.id} est dans la liste des non-assignables.`);
                continue;
            }

            // Ajouter le formateur à la liste s'il passe toutes les vérifications
            let isChecked = selectedFormateurs.includes(formateur.id) ? 'checked' : '';
            let formateurHtml = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" 
                           value="${formateur.id}" 
                           id="formateur${formateur.id}" 
                           ${isChecked}>
                    <label class="form-check-label" for="formateur${formateur.id}">
                        ${formateur.nom} ${formateur.prenom}
                    </label>
                </div>
            `;
            formateursList.append(formateurHtml);
        } catch (error) {
            console.error(`Erreur lors du traitement du formateur ${formateur.id} :`, error);
        }
    }

    // Limiter le nombre de sélections à 3 formateurs
    $('.form-check-input').on('change', function () {
        const checkedCount = $('.form-check-input:checked').length;
        if (checkedCount > 3) {
            alert("Vous ne pouvez sélectionner que trois formateurs maximum.");
            $(this).prop('checked', false); // Désélectionner le dernier coché
        }
    });
}

// Vérification de disponibilité étendue pour les événements de soirée
function isFormateurAvailableForDates(formateurId, newStartDate, newEndDate, newEventType) {
    const formateur = formateursData[formateurId];

    // 1. Vérification des indisponibilités
    if (formateur.indisponibilites) {
        for (let indisponibilite of formateur.indisponibilites) {
            let indisponibiliteStart = new Date(indisponibilite.dateDebut.split('/').reverse().join('-'));
            let indisponibiliteEnd = new Date(indisponibilite.dateFin.split('/').reverse().join('-'));

            if (
                (newStartDate <= indisponibiliteEnd && newStartDate >= indisponibiliteStart) ||
                (newEndDate <= indisponibiliteEnd && newEndDate >= indisponibiliteStart) ||
                (newStartDate <= indisponibiliteStart && newEndDate >= indisponibiliteEnd)
            ) {
                if (newEventType === "soirée") continue;

                return false;
            }
        }
    }

    // 2. Vérification des conflits avec d'autres événements
    for (let existingEvent of eventsArray) {
        if (existingEvent.formateur_ids && existingEvent.formateur_ids.includes(formateurId)) {
            let eventStartDate = new Date(existingEvent.date_debut.split('/').reverse().join('-'));
            let eventEndDate = new Date(existingEvent.date_fin.split('/').reverse().join('-'));

            // Autoriser les événements de type soirée le jour du début d'un autre événement
            if (
                newEventType === "soirée" &&
                eventStartDate.toDateString() === newStartDate.toDateString()
            ) {
                continue;
            }

            if (
                (newStartDate <= eventEndDate && newStartDate >= eventStartDate) ||
                (newEndDate <= eventEndDate && newEndDate >= eventStartDate) ||
                (newStartDate <= eventStartDate && newEndDate >= eventEndDate)
            ) {
                return false;
            }
        }
    }

    return true;
}

// Gestion de la soumission du formulaire
$('#select-formateurs-form').on('submit', function (event) {
    event.preventDefault();
});

// Gestion du bouton "Confirmer"
$('#confirm-selection').on('click', function () {
    let selectedFormateurs = $('.form-check-input:checked').map(function () {
        return +$(this).val(); // Conversion en nombre
    }).get();

    let eventId = $('#selectFormateursModal').data('event-id');
    let eventIndex = eventsArray.findIndex(event => event.id == eventId);

    if (eventIndex !== -1) {
        let newEvent = eventsArray[eventIndex];

        // Vérifie si les formateurs sélectionnés sont disponibles
        for (let formateurId of selectedFormateurs) {
            if (!isFormateurAvailableForDates(
                formateurId,
                new Date(newEvent.date_debut.split('/').reverse().join('-')),
                new Date(newEvent.date_fin.split('/').reverse().join('-')),
                newEvent.methode
            )) {
                alert(`Le formateur avec l'ID ${formateurId} n'est pas disponible pour ces dates.`);
                return;
            }
        }

        // Mise à jour des formateurs dans l'événement
        eventsArray[eventIndex].formateur_ids = selectedFormateurs; // Assigner les nouveaux formateurs
        if (!eventsArray[eventIndex].formateur_status) {
            eventsArray[eventIndex].formateur_status = {};
        }

        selectedFormateurs.forEach(formateurId => {
            eventsArray[eventIndex].formateur_status[formateurId] = 'En attente';
        });

        eventsArray[eventIndex].choix = 'En attente';

        // Mettre à jour les données et reconstruire la table
        updateJsonData().then(() => {
            buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
            $('#selectFormateursModal').modal('hide');
        }).catch((error) => {
            console.error('Erreur lors de la mise à jour des données :', error);
            alert("Une erreur s'est produite lors de l'assignation des formateurs.");
        });
    } else {
        console.error('Événement non trouvé avec l\'ID :', eventId);
    }
});


        
        
        
        
        
        $('#add-theme-form').on('submit', function(event) {
            event.preventDefault();
        
            // Récupérer les valeurs du formulaire
            let mainThemeName = $('#new-theme').val();
            let secondaryThemeName = $('#secondary-theme').val(); // Nouveau thème secondaire
            let newDateDebut = $('#new-date-debut').val();
            let newDateFin = $('#new-date-fin').val();
            let newVille = $('#new-ville').val();
            let newMethode = $('#new-methode').val();
            let newRemarque = $('#new-remarque').val();
        
            // Trouver les thèmes dans les données
            let mainTheme = Object.values(themesData).find(theme => theme.name === mainThemeName);
            let secondaryTheme = Object.values(themesData).find(theme => theme.name === secondaryThemeName);
        
            if (!mainTheme || !newDateDebut || !newDateFin || !newVille || !newMethode) {
                showCustomAlert("Veuillez remplir tous les champs obligatoires.");
                return;
            }
        
            // Générer l'ID et le numéro de session pour l'événement
            let newEventId = generateNextEventId();
            let newNumSession = getLastSessionNumber(eventsArray) + 1;
        
            // Créer l'événement avec les deux thèmes
            let newEntry = {
                id: newEventId,
                theme_id: mainTheme.id, // Thème principal
                secondary_theme_id: secondaryTheme ? secondaryTheme.id : null, // Thème secondaire
                date_debut: newDateDebut,
                date_fin: newDateFin,
                ville: newVille,
                choix: "En attente",
                methode: newMethode,
                remarque: newRemarque,
                formateur_ids: [], // Aucun formateur assigné par défaut
                num_s: newNumSession,
            };
        
            // Ajouter l'événement
            $('#addEventModal').modal('hide');
            addEvent(newEntry);
        });
        
        
        
        function addEvent(newEntry) {
            // Si la méthode est "classe virtuelle", les coordonnées seront nulles
            if (newEntry.methode === "classe virtuelle") {
                newEntry.latitude = null;
                newEntry.longitude = null;
                saveEvent(newEntry);
                return;
            }
        
            // Sinon, récupérer les coordonnées de la ville
            getCoordinates(newEntry.ville)
                .then(({ latitude, longitude }) => {
                    newEntry.latitude = latitude;
                    newEntry.longitude = longitude;
                    saveEvent(newEntry);
                })
                .catch((error) => {
                    console.error('Erreur lors de la récupération des coordonnées :', error);
                    alert("Impossible de récupérer les coordonnées pour la ville spécifiée.");
                });
        }
        
        function getCoordinates(cityName) {
            const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
        
            return fetch(apiUrl)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP : ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.length > 0) {
                        return {
                            latitude: parseFloat(data[0].lat),
                            longitude: parseFloat(data[0].lon)
                        };
                    } else {
                        throw new Error("Ville introuvable.");
                    }
                });
        }
        
        
        function saveEvent(newEntry) {
            // Ajouter l'événement à l'array local
            eventsArray.push(newEntry);
        
            // Mettre à jour le fichier JSON côté serveur
            updateJsonData()
                .then(() => {
                    buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
                    updateEventsSansFormateursAlert();
                    updateRefusedEventsAlert();
                    updateCancellationRequestsAlert();
                    showCustomAlert("Événement ajouté avec succès avec ses coordonnées.");
                })
                .catch((error) => {
                    console.error('Erreur lors de l\'ajout de l\'événement :', error);
                    showCustomAlert("Une erreur s'est produite lors de l'ajout de l'événement.");
                });
        }
        
        
        
        









// Ouvrir le modal pour ajouter un formateur non assigné au thème
$('#assign-formateur-btn').on('click', function() {
    populateNonAssignedFormateursList();
    $('#addFormateurModal').modal('show');
});






// Fonction pour peupler la liste des formateurs non assignés au thème
function populateNonAssignedFormateursList(event) {
    const nonAssignedList = $('#nonAssignedFormateursList');
    nonAssignedList.empty();

    // Filtrer les formateurs non assignés au thème de l'événement
    const nonAssignedFormateurs = Object.values(formateursData).filter(formateur => {
        const isAssignedToTheme = formateur.themes.includes(event.theme_id); // Vérifier si assigné au thème
        const isAlreadyAssignedToEvent = event.formateur_ids.includes(formateur.id); // Vérifier si déjà assigné à l'événement

        return !isAssignedToTheme && !isAlreadyAssignedToEvent; // Inclure uniquement les non-assignés au thème
    });

    // Afficher un message s'il n'y a aucun formateur disponible
    if (nonAssignedFormateurs.length === 0) {
        nonAssignedList.append('<p>Aucun formateur non assigné disponible pour cet événement.</p>');
    } else {
        // Créer des cases à cocher pour chaque formateur
        nonAssignedFormateurs.forEach(formateur => {
            const formateurItem = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="formateur${formateur.id}" value="${formateur.id}">
                    <label class="form-check-label" for="formateur${formateur.id}">
                        ${formateur.nom} ${formateur.prenom}
                    </label>
                </div>`;
            nonAssignedList.append(formateurItem);
        });
    }
}



function assignFormateurToEvent(eventId, formateurId) {
    const eventIndex = eventsArray.findIndex(event => event.id == eventId);
    if (eventIndex === -1) {
        alert("Événement introuvable.");
        return;
    }

    const formateur = formateursData[formateurId];
    if (!formateur) {
        alert("Formateur introuvable.");
        return;
    }

    // ID du thème de l'événement
    const themeId = eventsArray[eventIndex].theme_id;

    // Vérifier si le thème est déjà assigné au formateur, sinon l'ajouter
    if (!formateur.themes.includes(themeId)) {
        formateur.themes.push(themeId);
        console.log(`Thème ${themeId} ajouté au formateur ${formateur.nom} ${formateur.prenom}.`);
    } else {
        console.log(`Le formateur ${formateur.nom} ${formateur.prenom} est déjà assigné au thème ${themeId}.`);
    }

    // Vérifie si le formateur est déjà assigné à l'événement
    if (eventsArray[eventIndex].formateur_ids.includes(parseInt(formateurId))) {
        alert(`Le formateur ${formateur.nom} ${formateur.prenom} est déjà assigné à cet événement.`);
        return;
    }

    // Ajouter le formateur à l'événement
    eventsArray[eventIndex].formateur_ids.push(parseInt(formateurId));
    if (!eventsArray[eventIndex].formateur_status) {
        eventsArray[eventIndex].formateur_status = {};
    }
    eventsArray[eventIndex].formateur_status[formateurId] = "En attente";

    // Mise à jour des données
    updateJsonData()
        .then(() => {
            alert(`Le formateur ${formateur.nom} ${formateur.prenom} a été assigné à l'événement et au thème ${themeId}.`);
            $('#nonAssignedFormateursModal').modal('hide');
            buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
        })
        .catch(error => {
            console.error("Erreur lors de l'assignation du formateur :", error);
            alert("Une erreur s'est produite lors de l'assignation du formateur.");
        });
}






// Quand le formulaire du modal est soumis
$('#add-formateur-form').on('submit', function(event) {
    event.preventDefault();
    let selectedFormateurId = $('input[name="selectedFormateur"]:checked').val();
    let selectedThemeName = $('#new-theme').val();
    let theme = Object.values(themesData).find(theme => theme.name === selectedThemeName);

    if (selectedFormateurId && theme) {
        let selectedFormateur = formateursData[selectedFormateurId];

        // Assigner le formateur au thème
        assignFormateurToTheme(selectedFormateur.id, theme.id).then(() => {
            // Ajouter le formateur à la liste de sélection
            $('#new-forma').append(`<option value="${selectedFormateur.id}" selected>${selectedFormateur.nom} ${selectedFormateur.prenom}</option>`);
            $('#new-forma').val(selectedFormateur.id); // Sélectionner automatiquement le formateur ajouté

            // Fermer le modal
            $('#addFormateurModal').modal('hide');
            showCustomAlert(`Le formateur ${selectedFormateur.nom} ${selectedFormateur.prenom} a été assigné au thème et à l'événement.`);
        }).catch(error => {
            showCustomAlert(`Erreur lors de l'assignation du formateur : ${error.message}`);
        });
    } else {
        alert('Veuillez sélectionner un formateur et un thème.');
    }
});

// Fonction pour assigner un formateur à un thème via le backend (à adapter selon ton API)
function assignFormateurToTheme(formateurId, themeId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: '/assign-formateur-to-theme',
            contentType: 'application/json',
            data: JSON.stringify({ formateurId, themeId }),
            success: function(response) {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error('Assignation échouée.'));
                }
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}
        

function showCustomAlert(message) {
    const alertBox = $('<div class="custom-alert"><div class="custom-alert-content"><p>' + message + '</p></div></div>');
    const closeButton = $('<button class="btn-close">Fermer</button>');

    closeButton.on('click', function() {
        alertBox.fadeOut(300, function() {
            alertBox.remove();
        });
    });

    alertBox.find('.custom-alert-content').append(closeButton);
    $('body').append(alertBox);

    alertBox.css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(236, 91, 21, 0.65)',
        color: '#fff',
        padding: '20px',
        borderRadius: '10px',
        zIndex: 1000,
        textAlign: 'center'
    });
    
    closeButton.css({
        backgroundColor: '#ffffff',
        color: '#ec5b15',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '15px'
    });

    alertBox.hide().fadeIn(300);
}

function showCustomConfirm(message, confirmCallback) {
    const confirmBox = $('<div class="custom-confirm"><div class="custom-confirm-content"><p>' + message + '</p></div></div>');
    const yesButton = $('<button class="btn-yes">Oui</button>');
    const noButton = $('<button class="btn-no">Non</button>');

    yesButton.on('click', function() {
        confirmBox.fadeOut(300, function() {
            confirmBox.remove();
        });
        if (confirmCallback) confirmCallback();
    });

    noButton.on('click', function() {
        confirmBox.fadeOut(300, function() {
            confirmBox.remove();
        });
    });

    confirmBox.find('.custom-confirm-content').append(yesButton, noButton);
    $('body').append(confirmBox);

    confirmBox.css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(236, 91, 21, 0.65)',
        color: '#fff',
        padding: '20px',
        borderRadius: '10px',
        zIndex: 1000,
        textAlign: 'center'
    });
    
    yesButton.css({
        backgroundColor: '#ffffff',
        color: '#ec5b15',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px'
    });

    noButton.css({
        backgroundColor: '#ffffff',
        color: '#ec5b15',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer'
    });

    confirmBox.hide().fadeIn(300);
}

        

function updateJsonData() {
    // Vérification de la validité de eventsArray
    if (!Array.isArray(eventsArray)) {
        console.error("eventsArray n'est pas un tableau valide.");
        return Promise.reject(new Error("eventsArray n'est pas un tableau valide."));
    }

    if (eventsArray.length === 0) {
        console.warn("eventsArray est vide. Aucun événement à mettre à jour.");
        return Promise.reject(new Error("eventsArray est vide."));
    }

    console.log("eventsArray contient", eventsArray.length, "événement(s).");

    return fetch('/database/events.json')
        .then(res => {
            if (!res.ok) throw new Error(`Erreur HTTP ! Statut : ${res.status}`);
            return res.json();
        })
        .then(dbData => {
            if (!dbData || typeof dbData !== 'object' || !Array.isArray(dbData.events)) {
                throw new Error("Structure de /database/events.json invalide.");
            }

            dbData.events = eventsArray; // Mise à jour des événements

            return fetch('/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbData)
            });
        })
        .then(response => {
            if (!response.ok) throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("Données mises à jour avec succès :", data.message);
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour des données :', error);
        });
}



        function sortEventsByStartDate(events) {
            return events.sort((a, b) => {
                let dateA = new Date(a.date_debut.split('/').reverse().join('-'));
                let dateB = new Date(b.date_debut.split('/').reverse().join('-'));
                return dateA - dateB;
            });
        }

        function fetchJsonData() {
            Promise.all([
                fetch('/database/events.json').then(res => res.json()),
                fetch('/database/formateurs.json').then(res => res.json()),
                fetch('/database/themes.json').then(res => res.json())
            ])
            .then(([eventsData, formateursDataJson, themesDataJson]) => {
                eventsArray = eventsData.events;
                themesData = Object.fromEntries(themesDataJson.themes.map(theme => [theme.id, theme]));
                formateursData = Object.fromEntries(formateursDataJson.formateurs.map(formateur => [formateur.id, formateur]));

                if (eventsArray.length > 0) {
                    lastEventId = Math.max(...eventsArray.map(event => event.id), 0);
                }

                initializeNotifications();

                currentMonth = 'all';

                eventsArray = sortEventsByStartDate(eventsArray);

                buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
                populateFormateursList();
                updateNavigation();
                attachRowClickEvents();
            })
            .catch((error) => {
                console.error("Impossible de récupérer les données :", error);
            });
        }

        $('#filter-dates-btn').on('click', function() {
            let startDate = $('#date-debut-input').datepicker('getDate');
            let endDate = $('#date-fin-input').datepicker('getDate');
            if (startDate && endDate) {
                let filteredData = filterByDate(startDate, endDate, eventsArray);
                buildTable(filteredData);
            } else {
                alert('Veuillez sélectionner des dates valides.');
            }
        });

        $('#themes-input').on('input', function() {
            let value = $(this).val();
            let data = searchTheme(value, eventsArray);
            buildTable(data);
        });

        $('#choix-input').on('input', function() {
            let value = $(this).val();
            let data = searchChoix(value, eventsArray);
            buildTable(data);
        });

        $('#formateur-input').on('input', function() {
            let value = $(this).val();
            let data = searchForma(value, eventsArray);
            buildTable(data);
        });

        $('#ville-input').on('input', function() {
            let value = $(this).val();
            let data = searchVille(value, eventsArray);
            buildTable(data);
        });

        $('#num-session-input').on('input', function() {
            let value = $(this).val();
            let data = searchNumSession(value, eventsArray);
            buildTable(data);
        });

        function filterByDate(startDate, endDate, data) {
            return data.filter(event => {
                let eventStartDate = new Date(event.date_debut.split('/').reverse().join('-'));
                let eventEndDate = new Date(event.date_fin.split('/').reverse().join('-'));
                return eventStartDate >= startDate && eventEndDate <= endDate;
            });
        }

        $('#methode-input').on('change', function() {
            let value = $(this).val();
            let data = filterByMethode(value, eventsArray);
            buildTable(data);
        });

        function filterByMethode(value, data) {
            if (!value) {
                return data;
            }
            return data.filter(event => event.methode === value);
        }

        $('th').on('click', function() {
            let column = $(this).data('colname'); // Colonne à trier
            let order = $(this).data('order') === 'asc' ? 'desc' : 'asc'; // Basculer l'ordre
            let thElement = $(this);
        
            // Réinitialiser les icônes de tri sur les autres colonnes
            $('th').not(this).data('order', null).each(function() {
                let headerText = $(this).text().replace(' ▼', '').replace(' ▲', '');
                $(this).text(headerText);
            });
        
            // Appliquer le tri sur les événements actuels
            let filteredEvents = filterByYearAndMonth(eventsArray, currentYear, currentMonth);
        
            const compare = (a, b) => {
                let valA = a[column] || '';
                let valB = b[column] || '';
        
                // Gestion du tri pour la colonne "choix"
                const choixOrder = {
                    'accepté': 1,
                    'refusé': 2,
                    'en attente': 3,
                    '': 4, // Cas où le choix est inexistant ou null
                    null: 4
                };
        
                if (column === 'choix') {
                    // Si la valeur de choix n'existe pas ou est null, on la traite comme une chaîne vide
                    valA = choixOrder[valA?.toLowerCase()] || 4;
                    valB = choixOrder[valB?.toLowerCase()] || 4;
                }
                // Cas particulier pour le tri par numéro de session (num_s)
                else if (column === 'num_s') {
                    valA = Number(valA);
                    valB = Number(valB);
                }
                // Cas particulier pour les dates
                else if (column.includes('date')) {
                    valA = new Date(valA.split('/').reverse().join('-'));
                    valB = new Date(valB.split('/').reverse().join('-'));
                }
                // Cas particulier pour le thème : on compare le nom du thème via themesData
                else if (column === 'theme') {
                    valA = themesData[a.theme_id]?.name.toLowerCase();
                    valB = themesData[b.theme_id]?.name.toLowerCase();
                }
                // Cas particulier pour les formateurs : on extrait les noms des formateurs
                else if (column === 'formateurs' || column === 'forma') {
                    let formateursA = a.formateur_ids.map(id => formateursData[id]?.nom + ' ' + formateursData[id]?.prenom).join(', ').toLowerCase();
                    let formateursB = b.formateur_ids.map(id => formateursData[id]?.nom + ' ' + formateursData[id]?.prenom).join(', ').toLowerCase();
                    valA = formateursA || '';
                    valB = formateursB || '';
                }
                // Cas particulier pour la colonne financement : tri alphabétique avec gestion des champs manquants
                else if (column === 'finan') {
                    valA = valA ? valA.toLowerCase() : ''; // Traiter les valeurs manquantes comme des chaînes vides
                    valB = valB ? valB.toLowerCase() : '';
                }
                // Cas générique pour d'autres colonnes (comme remarque, etc.)
                else {
                    valA = valA.toString().toLowerCase();
                    valB = valB.toString().toLowerCase();
                }
        
                // Appliquer le tri selon l'ordre (ascendant ou descendant)
                if (order === 'asc') {
                    return valA < valB ? -1 : valA > valB ? 1 : 0;
                } else {
                    return valA > valB ? -1 : valA < valB ? 1 : 0;
                }
            };
        
            // Trier les événements filtrés
            filteredEvents.sort(compare);
        
            // Mettre à jour l'ordre et l'icône dans l'en-tête de colonne
            thElement.data('order', order);
            if (order === 'asc') {
                thElement.text(thElement.text().replace(' ▼', '') + ' ▲');
            } else {
                thElement.text(thElement.text().replace(' ▲', '') + ' ▼');
            }
        
            // Reconstruire le tableau avec les données triées
            buildTable(filteredEvents);
        });
        
        
        
        
        
        

        function populateThemesList() {
            let themesList = $('#themes-list');
            themesList.empty();
            for (let theme of Object.values(themesData)) {
                themesList.append(`<option value="${theme.name}">`);
            }
        }

        function populateFormateursList() {
            let formateursList = $('#formateurs-list');
            formateursList.empty();
            for (let formateur of Object.values(formateursData)) {
                formateursList.append(`<li class="formateur-item" data-formateur-id="${formateur.id}">${formateur.nom} ${formateur.prenom}</li>`);
            }
        }

        function isFormateurAssignedToTheme(formateur, themeId) {
            return formateur.themes.includes(themeId);
        }

        function isFormateurAvailableForEvent(formateurId, newEvent) {
            for (let existingEvent of eventsArray) {
                if (existingEvent.formateur_ids && existingEvent.formateur_ids.includes(formateurId)) {
                    let eventStartDate = new Date(existingEvent.date_debut.split('/').reverse().join('-'));
                    let eventEndDate = new Date(existingEvent.date_fin.split('/').reverse().join('-'));
                    let newStartDate = new Date(newEvent.date_debut.split('/').reverse().join('-'));
                    let newEndDate = new Date(newEvent.date_fin.split('/').reverse().join('-'));
                    if ((newStartDate <= eventEndDate && newStartDate >= eventStartDate) ||
                        (newEndDate <= eventEndDate && newEndDate >= eventStartDate) ||
                        (newStartDate <= eventStartDate && newEndDate >= eventEndDate)) {
                        return false;
                    }
                }
            }
            return true;
        }

        function attachRemarqueEvents() {
            $(document).on('change', '.remarque-input', function() {
                let eventId = $(this).data('event-id');
                let newValue = $(this).val();
                let eventIndex = eventsArray.findIndex(event => event.id == eventId);
                if (eventIndex !== -1) {
                    eventsArray[eventIndex].remarque = newValue;
                    updateJsonData().then(() => {
                        console.log('Remarque mise à jour avec succès');
                    }).catch((error) => {
                        console.error('Erreur lors de la mise à jour de la remarque:', error);
                    });
                } else {
                    console.error('Événement non trouvé pour l\'ID:', eventId);
                }
            });
        }

        function buildTable(data) {
            let table = document.getElementById('myTable');
            table.innerHTML = '';
        
            for (let i = 0; i < data.length; i++) {
                let event = data[i];
                let mainTheme = themesData[event.theme_id];
                let secondaryTheme = event.secondary_theme_id ? themesData[event.secondary_theme_id] : null;
        
                if (!Array.isArray(event.formateur_ids)) {
                    console.error(`event.formateur_ids is not an array for event id ${event.id}`);
                    event.formateur_ids = [];
                }
        
                let formateurs = event.formateur_ids.map(id => formateursData[id]).filter(formateur => formateur !== undefined);
        
                let formateursHtml = formateurs.map(formateur => {
                    let formateurStatus = event.formateur_status && event.formateur_status[formateur.id] ? event.formateur_status[formateur.id] : "En attente";
                    let formateurColor = formateurStatus.toLowerCase() === "refusé" ? "red" : "black";
                    if (formateurStatus.toLowerCase() === "pending-cancel") {
                        formateurColor = "yellow";
                    }
                    return `<span style="color: ${formateurColor};${formateurStatus.toLowerCase() === "refusé" ? "animation: blinker 1s linear infinite;" : ""}">${formateur.nom} ${formateur.prenom}</span> <button class="btn btn-link remove-formateur-btn" data-event-id="${event.id}" data-formateur-id="${formateur.id}">❌</button>`;
                }).join('<br>');
        
                let choixCell = "En attente";
                let refusedFormateurs = formateurs.filter(formateur => event.formateur_status && event.formateur_status[formateur.id] && event.formateur_status[formateur.id].toLowerCase() === "refusé");
                let acceptedFormateurs = formateurs.filter(formateur => event.formateur_status && event.formateur_status[formateur.id] && event.formateur_status[formateur.id].toLowerCase() === "accepté");
        
                if (refusedFormateurs.length > 0 && acceptedFormateurs.length > 0) {
                    choixCell = `${acceptedFormateurs.length}/${formateurs.length} accepté(s)`;
                } else if (acceptedFormateurs.length === formateurs.length && formateurs.length > 0) {
                    choixCell = "Accepté";
                } else if (refusedFormateurs.length === formateurs.length && formateurs.length > 0) {
                    choixCell = "Refusé";
                }
        
                let choixColor = "";
                if (choixCell.toLowerCase() === "accepté") {
                    choixColor = "style='background-color: green;'";
                } else if (choixCell.toLowerCase() === "refusé") {
                    choixColor = "style='background-color: red;'";
                }
        
                let isDark = isColorDark(mainTheme.bck_color || '#fff');
                let textColor = isDark ? 'white' : 'black';
        
                function getDayOfWeek(dateStr) {
                    let [day, month, year] = dateStr.split('/');
                    let date = new Date(`${year}-${month}-${day}`);
                    return date.toLocaleString('default', { weekday: 'long' });
                }
        
                let startDayOfWeek = getDayOfWeek(event.date_debut);
                let endDayOfWeek = getDayOfWeek(event.date_fin);
        
                let rowColor = '';
                if (Object.values(event.formateur_status || {}).includes('pending-cancel')) {
                    rowColor = 'style="background-color: yellow;"';
                }
        
                // Construire la cellule des thèmes
                let themesHtml = `${mainTheme.name}`;
                if (secondaryTheme) {
                    themesHtml += ` + ${secondaryTheme.name}`;
                }
        
                let row = `<tr class="event-row" data-event-id="${event.id}" ${rowColor}>
                    <td style="background-color: ${mainTheme.bck_color || '#fff'}; color: ${textColor};">${themesHtml}</td>
                    <td>${startDayOfWeek} ${event.date_debut}</td>
                    <td>${endDayOfWeek} ${event.date_fin}</td>
                    <td>${event.ville}</td>
                    <td>${event.finan || mainTheme.type}</td>
                    <td>${event.methode}</td>
                    <td class="remarque-cell"><input type="text" class="remarque-input" value="${event.remarque}" data-event-id="${event.id}"></td>
                    <td class="formateur-cell" data-event-id="${event.id}">${formateursHtml}<button class="btn btn-link add-formateur-btn" data-event-id="${event.id}">Ajouter formateur</button></td>
                    <td ${choixColor}>${choixCell}</td>
                    <td>${event.num_s}</td>
                    <td><input type="checkbox" class="constel-checkbox" ${event.constel ? 'checked' : ''} data-event-id="${event.id}"></td>
                    <td><input type="checkbox" class="dpc-checkbox" ${event.dpc ? 'checked' : ''} data-event-id="${event.id}"></td>
                </tr>`;
                table.innerHTML += row;
            }
            attachRowClickEvents();
            attachCheckboxEvents();
            attachRemarqueEvents();
        }
        
        

        


        function attachCheckboxEvents() {
            $('.constel-checkbox').on('change', function() {
                let eventId = $(this).data('event-id');
                let isChecked = $(this).is(':checked');
                let eventIndex = eventsArray.findIndex(event => event.id == eventId);
                if (eventIndex !== -1) {
                    eventsArray[eventIndex].constel = isChecked;
                    if (isChecked) {
                        $(`.dpc-checkbox[data-event-id="${eventId}"]`).prop('checked', true);
                        eventsArray[eventIndex].dpc = true;
                    }
                    updateJsonData();
                }
            });

            $('.dpc-checkbox').on('change', function() {
                let eventId = $(this).data('event-id');
                let isChecked = $(this).is(':checked');
                let eventIndex = eventsArray.findIndex(event => event.id == eventId);
                if (eventIndex !== -1) {
                    eventsArray[eventIndex].dpc = isChecked;
                    updateJsonData();
                }
            });
        }

        function searchTheme(value, data) {
            let filteredTheme = [];
            value = value.toLowerCase();
            for (let i = 0; i < data.length; i++) {
                let theme = themesData[data[i].theme_id].name.toLowerCase();
                if (theme.includes(value)) {
                    filteredTheme.push(data[i]);
                }
            }
            return filteredTheme;
        }

        function searchChoix(value, data) {
            if (value.toLowerCase() === "tous") {
                return data;
            }

            let filteredChoix = [];
            value = value.toLowerCase();
            for (let i = 0; i < data.length; i++) {
                let choix = data[i].choix ? data[i].choix.toLowerCase() : 'en attente';
                if (choix.includes(value)) {
                    filteredChoix.push(data[i]);
                }
            }
            return filteredChoix;
        }

        $('#choix-input').on('change', function() {
            let value = $(this).val();
            let data = searchChoix(value, eventsArray);
            buildTable(data);
        });

        function searchForma(value, data) {
            let filteredForma = [];
            value = value.toLowerCase();
            for (let i = 0; i < data.length; i++) {
                let formateurs = data[i].formateur_ids.map(id => formateursData[id]);
                let formateurName = formateurs.map(formateur => `${formateur.nom} ${formateur.prenom}`.toLowerCase()).join(' ');
                if (formateurName.includes(value)) {
                    filteredForma.push(data[i]);
                }
            }
            return filteredForma;
        }

        function searchVille(value, data) {
            let filteredVille = [];
            value = value.toLowerCase();
            for (let i = 0; i < data.length; i++) {
                let ville = data[i].ville.toLowerCase();
                if (ville.includes(value)) {
                    filteredVille.push(data[i]);
                }
            }
            return filteredVille;
        }

        function searchNumSession(value, data) {
            let filteredNumSession = [];
            value = value.toLowerCase();
            for (let i = 0; i < data.length; i++) {
                let numSession = (data[i].num_s || '').toString().toLowerCase();
                if (numSession.includes(value)) {
                    filteredNumSession.push(data[i]);
                }
            }
            return filteredNumSession;
        }

        function isDuplicateEvent(newEvent, eventsArray) {
            for (let event of eventsArray) {
                for (let formateurId of newEvent.formateur_ids) {
                    if (event.formateur_ids.includes(formateurId)) {
                        let eventStartDate = new Date(event.date_debut.split('/').reverse().join('-'));
                        let eventEndDate = new Date(event.date_fin.split('/').reverse().join('-'));
                        let newStartDate = new Date(newEvent.date_debut.split('/').reverse().join('-'));
                        let newEndDate = new Date(newEvent.date_fin.split('/').reverse().join('-'));
                        if ((newStartDate <= eventEndDate && newStartDate >= eventStartDate) ||
                            (newEndDate <= eventEndDate && newEndDate >= eventStartDate)) {
                            return true;
                        }
                    }
                }
                if (event.num_s === newEvent.num_s) {
                    return true;
                }
            }
            return false;
        }

        const getLastSessionNumber = (events) => {
            let lastSessionNumber = 0;
            for (let event of events) {
                if (event.num_s > lastSessionNumber) {
                    lastSessionNumber = event.num_s;
                }
            }
            return lastSessionNumber;
        };

        const generateNextEventId = () => ++lastEventId;

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

        function initializeNotifications() {
            let eventsThisMonth = filterByYearAndMonth(eventsArray, currentYear, currentMonth);
            let notificationMessage = "Vous avez " + eventsThisMonth.length + " événements prévus ce mois-ci.";
            displayNotification(notificationMessage);

            updateEventsSansFormateursAlert();
            updateRefusedEventsAlert();
        }

        function updateEventsSansFormateursAlert() {
            let currentMonthEvents = filterByYearAndMonth(eventsArray, currentYear, currentMonth);
            let eventsSansFormateurs = currentMonthEvents.filter(event => event.formateur_ids.length === 0);
            let unassignedEventsButton = $('#unassigned-events-btn');
        
            if (eventsSansFormateurs.length > 0) {
                unassignedEventsButton.text(eventsSansFormateurs.length + ' formations sans formateurs');
                unassignedEventsButton.show();
        
                // Gérer le clic pour rester sur cette vue
                unassignedEventsButton.off('click').on('click', function() {
                    buildTable(eventsSansFormateurs);
                    sessionStorage.setItem('last-view', 'unassigned'); // Enregistrer la vue
                });
            } else {
                unassignedEventsButton.hide();
            }
        }
        
        // Après un formateur assigné, reconstruire la vue précédente
        function afterAssigningFormateur() {
            let lastView = sessionStorage.getItem('last-view');
            if (lastView === 'unassigned') {
                let currentMonthEvents = filterByYearAndMonth(eventsArray, currentYear, currentMonth);
                let eventsSansFormateurs = currentMonthEvents.filter(event => event.formateur_ids.length === 0);
                buildTable(eventsSansFormateurs); // Rester sur la vue "Formations sans formateurs"
            } else {
                buildTable(filterByYearAndMonth(eventsArray, currentYear, currentMonth));
            }
        }
        
// Vérifier si les données sont bien chargées avant d'appeler updateJsonData
function ensureEventsArrayInitialized() {
    return new Promise((resolve, reject) => {
        if (Array.isArray(eventsArray) && eventsArray.length > 0) {
            resolve();
        } else {
            console.warn("Attente de l'initialisation de eventsArray...");
            let checkInterval = setInterval(() => {
                if (Array.isArray(eventsArray) && eventsArray.length > 0) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100); // Vérifie toutes les 100ms
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error("eventsArray n'a pas pu être initialisé."));
            }, 5000); // Timeout après 5 secondes
        }
    });
}

// Réécriture de l'appel avec la vérification
ensureEventsArrayInitialized()
    .then(() => {
        return updateJsonData();
    })
    .then(() => {
        afterAssigningFormateur(); // Mise à jour après ajout
        $('#selectFormateursModal').modal('hide');
    })
    .catch((error) => {
        console.error('Erreur lors de la mise à jour des données :', error);
        alert("Une erreur s'est produite lors de l'assignation des formateurs.");
    });

        
        

                // Mettre à jour l'alerte des événements refusés
                function updateRefusedEventsAlert() {
                    let refusedCount = eventsArray.filter(event => {
                        return Object.values(event.formateur_status || {}).some(status => status.toLowerCase() === 'refusé');
                    }).length;
                
                    if (refusedCount > 0) {
                        $('#refused-events-btn').text(`${refusedCount} formations refusées`);
                        $('#refused-events-btn').show();
                    } else {
                        $('#refused-events-btn').hide();
                    }
                }
                
                function openAssignFormateurModal(eventId) {
                    // Trouver l'événement correspondant
                    const event = eventsArray.find(event => event.id === parseInt(eventId, 10));
                    if (!event) {
                        console.error(`Événement introuvable avec l'ID : ${eventId}`);
                        alert("Événement introuvable !");
                        return;
                    }
                
                    // Ajouter dynamiquement l'ID de l'événement au modal principal
                    const modal = $('#selectFormateursModal');
                    modal.data('event-id', eventId); // Stocker l'ID de l'événement
                
                    // Peupler les formateurs déjà assignés
                    populateFormateursCheckboxes(event);
                
                    // Ajouter un bouton pour ouvrir le sous-modal
                    const modalFooter = modal.find('.modal-footer');
                    modalFooter.find('.open-non-assigned-modal').remove(); // Évite les doublons
                
                    const openNonAssignedButton = $('<button>')
                        .text('Formateurs non assignés')
                        .addClass('btn btn-secondary open-non-assigned-modal')
                        .on('click', function () {
                            openNonAssignedFormateursModal(); // Ouvre le sous-modal dynamique (récupère l'ID du modal principal)
                        });
                
                    modalFooter.append(openNonAssignedButton);
                
                    // Afficher le modal principal
                    modal.modal('show');
                }
                
                // Fonction pour gérer le sous-modal
                window.openNonAssignedFormateursModal = function () {
                    // Vérifier que le sous-modal existe
                    ensureNonAssignedFormateursModalExists();
                
                    // Récupérer l'ID de l'événement stocké dans le modal principal
                    const eventId = $('#selectFormateursModal').data('event-id');
                    if (!eventId) {
                        console.error("ID de l'événement introuvable dans le modal principal.");
                        alert("Impossible de récupérer l'ID de l'événement. Veuillez réessayer.");
                        return;
                    }
                
                    // Trouver l'événement correspondant
                    const event = eventsArray.find(event => event.id === parseInt(eventId, 10));
                    if (!event) {
                        console.error(`Événement introuvable avec l'ID : ${eventId}`);
                        alert("Événement introuvable pour afficher les formateurs non assignés.");
                        return;
                    }
                
                    // Masquer le modal principal
                    $('#selectFormateursModal').modal('hide');
                
                    // Charger la liste des formateurs non assignés
                    populateNonAssignedFormateursList(event);
                
                    // Afficher le sous-modal
                    const nonAssignedModal = $('#nonAssignedFormateursModal');
                    nonAssignedModal.off('hidden.bs.modal'); // Évite les doublons d'événements
                    nonAssignedModal.modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                
                    // Lorsque le sous-modal est fermé, rouvrir le modal principal
                    nonAssignedModal.on('hidden.bs.modal', function () {
                        $('#selectFormateursModal').modal('show');
                    });
                
                    $('#nonAssignedFormateursModal').on('click', '#assignSelectedFormateurs', function () {
                        const selectedFormateurs = $('#nonAssignedFormateursList input[type="checkbox"]:checked').map(function () {
                            return parseInt($(this).val(), 10);
                        }).get();
                    
                        if (selectedFormateurs.length === 0) {
                            alert("Veuillez sélectionner au moins un formateur à assigner.");
                            return;
                        }
                    
                        const eventId = $('#selectFormateursModal').data('event-id');
                        if (!eventId) {
                            alert("Impossible de récupérer l'ID de l'événement.");
                            return;
                        }
                    
                        selectedFormateurs.forEach(formateurId => {
                            assignFormateurToEvent(eventId, formateurId); // Appelle la fonction modifiée
                        });
                    });
                    $('#nonAssignedFormateursModal').off('click', '#assignSelectedFormateurs').on('click', '#assignSelectedFormateurs', function () {
                        const selectedFormateurs = $('#nonAssignedFormateursList input[type="checkbox"]:checked').map(function () {
                            return parseInt($(this).val(), 10);
                        }).get();
                    
                        if (selectedFormateurs.length === 0) {
                            alert("Veuillez sélectionner au moins un formateur à assigner.");
                            return;
                        }
                    
                        const eventId = $('#selectFormateursModal').data('event-id');
                        if (!eventId) {
                            alert("Impossible de récupérer l'ID de l'événement.");
                            return;
                        }
                    
                        selectedFormateurs.forEach(formateurId => {
                            assignFormateurToEvent(eventId, formateurId); // Fonction d'assignation unique
                        });
                    
                        $('#nonAssignedFormateursModal').modal('hide'); // Fermer après assignation
                    });
                    

                    
                    console.log(`Sous-modal ouvert pour l'événement ID : ${eventId}`);
                    // Gestion du bouton "Fermer"
                    $('#nonAssignedFormateursModal').on('click', '.btn-secondary', function () {
                        $('#nonAssignedFormateursModal').modal('hide');
                    });

                    // Gestion du bouton "Assigner"
                    $('#nonAssignedFormateursModal').on('click', '#assignSelectedFormateurs', function () {
                        const selectedFormateurId = $('#nonAssignedFormateursList input[type="checkbox"]:checked').val();
                        if (!selectedFormateurId) {
                            alert("Veuillez sélectionner un formateur à assigner.");
                            return;
                        }
                    
                        // Récupérer l'ID de l'événement
                        const eventId = $('#selectFormateursModal').data('event-id');
                        if (!eventId) {
                            alert("Impossible de récupérer l'ID de l'événement.");
                            return;
                        }
                    
                        // Assigner le formateur au thème
                        assignFormateurToEvent(eventId, selectedFormateurId);
                    });
              
                };
  
                function ensureNonAssignedFormateursModalExists() {
                    if ($('#nonAssignedFormateursModal').length === 0) {
                        const nonAssignedModalHtml = `
                            <div id="nonAssignedFormateursModal" class="modal fade" tabindex="-1" role="dialog">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title">Formateurs Non Assignés</h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body">
                                            <div id="nonAssignedFormateursList">
                                                <!-- La liste des formateurs non assignés sera injectée ici -->
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                                            <button type="button" class="btn btn-primary" id="assignSelectedFormateurs">Assigner</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        $('body').append(nonAssignedModalHtml);
                    }
                }
                
                
                
                
                // Ajout de l'événement pour ouvrir le sous-modal
                $('#selectFormateursModal').on('click', '.open-non-assigned-modal', function () {
                    const eventId = $(this).data('event-id');
                    openNonAssignedFormateursModal(eventId);
                });
                
                updateRefusedEventsAlert(); // Ajouter cette ligne

        function displayNotification(message) {
            let notificationContainer = $('<div class="notification-container"></div>');
            let notificationMessage = $('<p class="notification-message"></p>').text(message);
            let closeButton = $('<button class="btn btn-primary btn-sm close-notification-btn">Fermer</button>');

            notificationContainer.append(notificationMessage).append(closeButton);
            $('body').append(notificationContainer);

            closeButton.on('click', function() {
                notificationContainer.remove();
            });

            setTimeout(function() {
                notificationContainer.remove();
            }, 5000);
        }

        $('#refused-events-btn').on('click', function() {
            let refusedEvents = eventsArray.filter(event => {
                return Object.values(event.formateur_status || {}).some(status => status.toLowerCase() === 'refusé');
            });
            buildTable(refusedEvents);
        });
        



        $('#logout-btn').on('click', function() {
            $.ajax({
                type: 'POST',
                url: '/logout',
                contentType: 'application/json',
                success: function(response) {
                    alert('Déconnexion réussie.');
                    window.location.href = '/admin/login_admin.html';
                },
                error: function() {
                    alert('Erreur lors de la déconnexion. Veuillez réessayer.');
                }
            });
        });
    }



    
});
