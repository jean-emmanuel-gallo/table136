// // notification_admin.js

// // Connexion à Socket.IO
// const socket = io();

// // Fonction pour afficher une notification
// function showNotification(message, eventId, formateurId, status) {
//     const notification = document.createElement('div');
//     notification.classList.add('admin-notification');
//     notification.innerText = message;

//     // Rendre la notification cliquable
//     notification.addEventListener('click', function () {
//         displaySingleEvent(eventId, formateurId, status);
//     });

//     document.body.appendChild(notification);

//     // Faire disparaître la notification après 5 secondes
//     setTimeout(() => {
//         notification.remove();
//     }, 5000);
// }

// // Fonction pour émettre un événement personnalisé
// function displaySingleEvent(eventId, formateurId, status) {
//     const singleEvent = new CustomEvent('showSingleEvent', { detail: { eventId, formateurId, status } });
//     window.dispatchEvent(singleEvent);
// }

// // Fonction pour mettre à jour le tableau avec un seul événement
// function updateTableWithSingleEvent(eventId) {
//     console.log("ID de l'événement reçu dans la notification :", eventId); // Log pour vérifier l'ID reçu

//     fetch('database/events.json')
//         .then(res => res.json())
//         .then(eventsData => {
//             console.log("Événements récupérés :", eventsData.events); // Log pour voir les événements récupérés

//             // Convertir tous les IDs en chaîne pour éviter les problèmes de type
//             const event = eventsData.events.find(event => String(event.id) === String(eventId)); // Comparer en tant que chaîne

//             if (event) {
//                 console.log("Événement trouvé :", event); // Log pour confirmer que l'événement a été trouvé
//                 buildTable([event]); // Utilise la fonction `buildTable` pour afficher l'événement dans le tableau
//             } else {
//                 console.error('Événement non trouvé avec cet ID :', eventId);
//             }
//         })
//         .catch(error => {
//             console.error('Erreur lors de la récupération de l\'événement:', error);
//         });
// }

// let lastNotification = null; // Variable pour stocker la dernière notification

// socket.on('notifyAdmin', (data) => {
//     console.log('Nouvelle notification pour admin', data);
//     addNotificationToBell(data);

//     // Vérifier si la notification est différente de la dernière
//     if (!lastNotification || lastNotification.eventId !== data.eventId || lastNotification.status !== data.status) {
//         incrementRefreshCount(); // Incrémenter seulement si c'est une nouvelle notification
//     }

//     $('#refresh-btn').show(); // Afficher le bouton "Rafraîchir la page"
    
//     // Mettre à jour la dernière notification traitée
//     lastNotification = {
//         eventId: data.eventId,
//         status: data.status
//     };
// });
