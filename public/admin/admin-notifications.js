// const socket = io();

// // Mise à jour en temps réel des notifications
// socket.on('formateurUpdated', (data) => {
//     if (data.type === 'formateurUpdate') {
//         // Incrémenter le badge des formateurs
//         const formateursBadge = document.getElementById('formateurs-badge');
//         formateursBadge.textContent = parseInt(formateursBadge.textContent || 0) + 1;
//     }
// });


// // Écouter l'événement de mise à jour des formateurs
// socket.on('formateurUpdated', (data) => {
//     showAdminPopup(`${data.prenom} ${data.nom} a modifié ses coordonnées.`);
// });

// // Fonction pour afficher une pop-up de notification
// function showAdminPopup(message) {
//     const popup = $('<div></div>')
//         .addClass('admin-popup')
//         .text(message)
//         .css({
//             "background": "#ec5b15",
//             "color": "#fff",
//             "padding": "10px 20px",
//             "border-radius": "5px",
//             "position": "fixed",
//             "bottom": "20px",
//             "right": "20px",
//             "z-index": "1000",
//             "box-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
//             "font-size": "14px",
//             "opacity": "0.9"
//         });

//     $('body').append(popup);

//     setTimeout(() => {
//         popup.fadeOut(500, () => popup.remove());
//     }, 3000);
// }


// // Charger les notifications au démarrage
// fetch('/get-notifications')
//     .then(response => response.json())
//     .then(notifications => {
//         // Mettre à jour les badges
//         document.getElementById('formateurs-badge').textContent = notifications.formateurs || 0;
//         document.getElementById('ajout-formateur-badge').textContent = notifications.ajoutFormateur || 0;
//     })
//     .catch(error => console.error('Erreur lors du chargement des notifications:', error));
