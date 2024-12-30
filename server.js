const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const http = require('http'); // Serveur HTTP pour Socket.IO
const socketIO = require('socket.io'); // Socket.IO pour la communication en temps réel
const logAdminFilePath = './database/log_admin.json'; // Fichier pour les logs des connexions admin
const logFormateurFilePath = './database/log_formateur.json'; // Fichier pour les logs des connexions formateurs
const fpFilePath = './database/fp.json'; // Chemin vers le fichier fp.json
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Charger les variables d'environnement






const app = express();
const server = http.createServer(app); // Crée un serveur HTTP avec Express
const io = socketIO(server); // Initialise Socket.IO avec le serveur HTTP

const dbFilePath = './database/db.json';
const formateursFilePath = './database/formateurs.json';
const themesFilePath = './database/themes.json';
const eventsFilePath = './database/events.json';
const deletedEventsFilePath = './database/dltEvents.json';
const eventsData = JSON.parse(fs.readFileSync('./database/events.json', 'utf8'));
const events = eventsData.events;

console.log('Événements chargés:', events);
console.log('Type de events:', typeof events);



// Middleware pour bloquer l'accès direct aux fichiers JSON via la barre d'adresse
// Middleware pour bloquer l'accès direct aux fichiers JSON via la barre d'adresse
app.use('/database', (req, res, next) => {
    const isJsonRequest = req.url.endsWith('.json');
    const referer = req.headers.referer || '';
    const host = req.headers.host;

    if (isJsonRequest) {
        // Vérifier si la requête provient du même domaine ou si c'est une requête AJAX
        if (referer.includes(host) || req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            next(); // Autoriser l'accès si c'est une requête légitime du site
        } else {
            // Si c'est une tentative d'accès direct, rediriger selon le rôle de l'utilisateur
            if (req.session && req.session.user) {
                if (req.session.role === 'admin') {
                    return res.redirect('/admin/acc_admin.html'); // Redirection pour admin
                } else if (req.session.role === 'formateur') {
                    return res.redirect('/formateurs/accueil_formateur.html'); // Redirection pour formateur
                }
            } else {
                // Si personne n'est connecté, interdire l'accès
                return res.redirect('/formateurs/login.html'); // Redirection vers une page publique pour visiteurs non connectés
            }
        }
    } else {
        next(); // Continuer pour toutes les autres requêtes non JSON
    }
});

// Servir les fichiers statiques dans 'database' pour les requêtes internes légitimes
app.use('/database', express.static(path.join(__dirname, 'database')));


// Autoriser l'accès aux fichiers statiques
app.use('/database', express.static(path.join(__dirname, 'database')));

app.use(session({
    secret: process.env.SESSION_SECRET, // Utilise la clé depuis .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 3600000
    }
}));

app.use('/admin/addformateur', express.static(path.join(__dirname, 'admin/addformateur')));



app.get('/log_admin.json', (req, res) => {
    if (req.session && req.session.user && req.session.role === 'admin') {
        fs.readFile(path.join(__dirname, 'database/log_admin.json'), 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture de log_admin.json:', err);
                return res.status(500).json({ message: 'Erreur lors de la récupération des logs.' });
            }
            res.json(JSON.parse(data));
        });
    } else {
        res.status(403).json({ message: 'Accès refusé.' });
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.get('/notifications.json', (req, res) => {
    const notificationsPath = './database/notifications.json';

    fs.readFile(notificationsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de notifications.json:', err);
            return res.status(404).send('notifications.json non trouvé');
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});


// Routes pour les données
app.get('/events', (req, res) => {
    const events = JSON.parse(fs.readFileSync('./database/events.json', 'utf8'));
    res.json(events);
  });
  
  app.get('/formateurs', (req, res) => {
    const formateurs = JSON.parse(fs.readFileSync('./database/formateurs.json', 'utf8'));
    res.json(formateurs);
  });
  
  app.get('/themes', (req, res) => {
    const themes = JSON.parse(fs.readFileSync('./database/themes.json', 'utf8'));
    res.json(themes);
  });
  

  app.patch('/events/:id', (req, res) => {
    console.log('Corps de la requête:', req.body); // Log pour vérifier la requête
    const { formateur_ids } = req.body;

    if (!formateur_ids || !Array.isArray(formateur_ids)) {
        return res.status(400).json({ error: 'formateur_ids doit être un tableau.' });
    }

    const eventId = parseInt(req.params.id);

    // Charger les données depuis le fichier JSON
    fs.readFile(eventsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de events.json:', err);
            return res.status(500).json({ error: 'Erreur serveur.' });
        }

        let eventsData;
        try {
            eventsData = JSON.parse(data); // Vérifiez la structure JSON
        } catch (parseError) {
            console.error('Erreur lors du parsing de events.json:', parseError);
            return res.status(500).json({ error: 'Erreur de format JSON.' });
        }

        const events = eventsData.events;

        if (!Array.isArray(events)) {
            console.error('La structure des événements est incorrecte.');
            return res.status(500).json({ error: 'La structure des événements est incorrecte.' });
        }

        // Trouver l'index de l'événement
        const eventIndex = events.findIndex(event => event.id === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Événement non trouvé.' });
        }

        // Mettre à jour formateur_ids pour l'événement
        events[eventIndex].formateur_ids = formateur_ids;

        // Sauvegarder les changements dans le fichier JSON
        fs.writeFile(eventsFilePath, JSON.stringify({ events }, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Erreur lors de la sauvegarde des événements:', writeErr);
                return res.status(500).json({ error: 'Erreur lors de la sauvegarde des événements.' });
            }

            console.log('Événement mis à jour avec succès:', events[eventIndex]);
            res.status(200).json(events[eventIndex]);
        });
    });
});





app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'daae3df31dfa671aaeaa46a6954ee904a43d45b66bde65c8d986e1958b017f6f3c204b383136dc6dfcd33f28a414d4f4c9d876781b883295be412ad8d979dee6',
    resave: false,
    saveUninitialized: true
}));



// Route pour ajouter un nouveau thème
app.post('/add-theme', (req, res) => {
    const newTheme = req.body;

    // Lire le fichier themes.json
    fs.readFile(themesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de themes.json :', err);
            return res.status(500).send('Erreur du serveur lors de la lecture des thèmes.');
        }

        let themesData;
        try {
            themesData = JSON.parse(data);
        } catch (parseError) {
            console.error('Erreur lors du parsing de themes.json :', parseError);
            return res.status(500).send('Erreur lors de l\'analyse des données des thèmes.');
        }

        // Ajouter le nouveau thème
        themesData.themes.push(newTheme);

        // Écrire les données mises à jour dans themes.json
        fs.writeFile(themesFilePath, JSON.stringify(themesData, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Erreur lors de l\'écriture dans themes.json :', writeErr);
                return res.status(500).send('Erreur du serveur lors de l\'écriture des thèmes.');
            }

            res.status(200).json({ message: 'Thème ajouté avec succès' });
        });
    });
});


// Connexion WebSocket pour gérer les notifications en temps réel
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté via WebSocket.');

    // Gestion des événements envoyés par les formateurs
    // Lorsque le formateur fait un choix
    socket.on('formateurChoice', (data) => {
        try {
            console.log('Choix reçu du formateur:', data);
            if (!data || !data.choice || !data.formateurId) {
                console.error('Données invalides pour formateurChoice:', data);
                return;
            }

            // Envoyer une notification pour le bouton "Rafraîchir"
            io.emit('notifyAdminRefresh', {
                formateurId: data.formateurId,
                choice: data.choice,
                message: `Le formateur ${data.formateurId} a fait un choix : ${data.choice}`
            });
        } catch (error) {
            console.error('Erreur lors de la gestion de formateurChoice:', error);
        }
    });

    // Gestion des mises à jour des coordonnées du formateur
// Gestion des mises à jour des coordonnées du formateur
socket.on('formateurUpdate', (data) => {
    console.log('formateurUpdate reçu côté serveur :', data); // Vérifier les données reçues
    io.emit('formateurUpdate', {
        message: `Le formateur ${data.formateurName} a mis à jour ses coordonnées.`
    });
});

    
     // Écoute l'événement formateurAction
     socket.on('formateurAction', (data) => {
        try {
            console.log('Action reçue du formateur :', data);

            // Vérifie que les données reçues sont valides
            if (!data || !data.formateurId || !data.eventId || !data.status) {
                console.error('Données invalides reçues pour formateurAction :', data);
                return;
            }

            // Envoie une notification à tous les admins connectés
            io.emit('notifyAdmin', {
                formateurId: data.formateurId,
                formateurName: data.formateurName,
                eventDate: data.eventDate,
                status: data.status
            });

            console.log(`Notification envoyée aux admins : Le formateur ${data.formateurName} a ${data.status} l'événement prévu le ${data.eventDate}.`);
        } catch (error) {
            console.error('Erreur lors de la gestion de formateurAction :', error);
        }
    });


    // Gestion de la déconnexion de l'utilisateur
    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté.');
    });

    // Événement générique pour toutes les notifications
    socket.on('sendNotification', (data) => {
        try {
            console.log('Notification reçue pour diffusion :', data);
            if (!data || !data.message) {
                console.error('Données invalides pour sendNotification:', data);
                return;
            }

            io.emit('notifyAdminPopup', {
                message: data.message,
                type: data.type || 'info',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erreur lors de la gestion de sendNotification:', error);
        }
    });
});





// Configuration du transporteur Nodemailer avec Brevo
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,
    auth: {
        user: '19efc9001@smtp-brevo.com',  // Identifiant SMTP
        pass: 'twHBNZqXmdW4P7C2'  // Mot de passe d'application
    }
});

// Route pour envoyer un email de réinitialisation de mot de passe et supprimer la demande dans fp.json
app.post('/send-new-password', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'error', message: 'Email ou mot de passe manquant.' });
    }

    // Envoyer l'email de réinitialisation
    const mailOptions = {
        from: 'jean-emmanuel.gallo@laplateforme.io',
        to: email,
        subject: 'Réinitialisation de mot de passe',
        html: `
            <p>Bonjour,</p>
            <p>Votre mot de passe a été réinitialisé. Voici votre nouveau mot de passe :</p>
            <p><strong>${password}</strong></p>
            <p>Merci de vous connecter avec ce mot de passe et de le modifier immédiatement.</p>
            <p>Cordialement,</p>
            <p>L'équipe Support</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email envoyé à ${email} : ${info.response}`);

        // Supprimer la demande de réinitialisation dans fp.json
        fs.readFile(fpFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture de fp.json :', err);
                return res.status(500).json({ status: 'error', message: 'Erreur du serveur' });
            }

            let requests;
            try {
                requests = JSON.parse(data).demandes;
            } catch (parseError) {
                console.error('Erreur lors du parsing de fp.json :', parseError);
                return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse des demandes.' });
            }

            // Trouver et supprimer la demande correspondante
            const requestIndex = requests.findIndex(request => request.mail === email);
            if (requestIndex !== -1) {
                requests.splice(requestIndex, 1); // Supprimer la demande
            }

            // Sauvegarder les nouvelles demandes dans fp.json
            fs.writeFile(fpFilePath, JSON.stringify({ demandes: requests }, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Erreur lors de l\'écriture dans fp.json :', writeErr);
                    return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'écriture des demandes.' });
                }

                res.status(200).json({ status: 'success', message: 'Email envoyé et demande supprimée.' });
            });
        });
    } catch (error) {
        console.error(`Erreur lors de l'envoi de l'email à ${email} :`, error);
        res.status(500).json({ status: 'error', message: 'Erreur lors de l\'envoi de l\'email.' });
    }
});



// Ajouter cette route après celles qui gèrent l'envoi de mot de passe, comme `/send-new-password`:

app.post('/update-password', (req, res) => {
    const { email, newPassword } = req.body;

    // Mettre à jour le mot de passe du formateur dans formateurs.json
    fs.readFile(formateursFilePath, 'utf8', (err, formateursData) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Erreur lors de la lecture des formateurs.' });
        }

        let formateurs;
        try {
            formateurs = JSON.parse(formateursData).formateurs;
        } catch (parseError) {
            return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse des données des formateurs.' });
        }

        // Trouver le formateur et mettre à jour son mot de passe
        const formateur = formateurs.find(f => f.mail === email);
        if (!formateur) {
            return res.status(404).json({ status: 'error', message: 'Formateur non trouvé avec cet email.' });
        }

        formateur.password = newPassword; // Mettre à jour le mot de passe du formateur

        // Sauvegarder les données mises à jour dans formateurs.json
        fs.writeFile(formateursFilePath, JSON.stringify({ formateurs }, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'écriture dans formateurs.json.' });
            }

            // Supprimer la demande dans fp.json
            fs.readFile(fpFilePath, 'utf8', (fpErr, fpData) => {
                if (fpErr) {
                    return res.status(500).json({ status: 'error', message: 'Erreur lors de la lecture des demandes.' });
                }

                let fpRequests;
                try {
                    fpRequests = JSON.parse(fpData).demandes;
                } catch (parseError) {
                    return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse des demandes.' });
                }

                // Trouver et supprimer la demande
                const requestIndex = fpRequests.findIndex(request => request.mail === email);
                if (requestIndex !== -1) {
                    fpRequests.splice(requestIndex, 1); // Supprimer la demande
                }

                // Sauvegarder les données mises à jour dans fp.json
                fs.writeFile(fpFilePath, JSON.stringify({ demandes: fpRequests }, null, 2), (writeErr) => {
                    if (writeErr) {
                        return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'écriture dans fp.json.' });
                    }

                    // Réponse de succès
                    res.status(200).json({ status: 'success', message: 'Mot de passe mis à jour et demande supprimée.' });
                });
            });
        });
    });
});


app.post('/update-notifications', (req, res) => {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
        return res.status(400).json({ status: 'error', message: 'Données de notification invalides.' });
    }

    // Écriture propre dans le fichier
    fs.writeFile('./database/notifications.json', JSON.stringify({ notifications }, null, 2), (err) => {
        if (err) {
            console.error('Erreur lors de l\'écriture dans notifications.json :', err);
            return res.status(500).json({ status: 'error', message: 'Erreur lors de la mise à jour des notifications.' });
        }

        console.log('Notifications mises à jour avec succès.');
        res.status(200).json({ status: 'success', message: 'Notifications mises à jour avec succès.' });
    });
});





app.post('/send-identifiants-email', (req, res) => {
    const { email, message } = req.body;
    const mailOptions = {
        from: 'jean-emmanuel.gallo@laplateforme.io',  // Adresse expéditeur
        to: email,  // Adresse du destinataire
        subject: 'Vos identifiants de connexion',
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erreur lors de l\'envoi de l\'email:', error);
            return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'envoi de l\'email.' });
        }
        console.log('Email envoyé:', info.response);
        res.status(200).json({ status: 'success', message: 'Identifiants envoyés.' });
    });
});


// Route pour vérifier l'authentification de l'admin
app.get('/check-auth', (req, res) => {
    if (req.session && req.session.user && req.session.role === 'admin') {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});



app.get('/logadmin', (req, res) => {
    fs.readFile(logAdminFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des logs.' });
        }
        try {
            const logs = JSON.parse(data);
            const veroniqueLogs = logs.logins.filter(log => log.username === 'Véronique');
            res.json(veroniqueLogs);
        } catch (parseError) {
            res.status(500).json({ message: 'Erreur lors de l\'analyse des logs.' });
        }
    });
});



// Route pour vérifier si une demande de réinitialisation a déjà été faite
app.post('/check-reset-request', (req, res) => {
    const { email } = req.body;

    // Vérifie que l'email est fourni
    if (!email) {
        return res.status(400).json({ status: 'error', message: 'L\'email est requis.' });
    }

    fs.readFile(fpFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de fp.json :', err);
            return res.status(500).json({ status: 'error', message: 'Erreur du serveur.' });
        }

        try {
            const requests = JSON.parse(data).demandes;
            const existingRequest = requests.find(request => request.mail === email);

            if (existingRequest) {
                console.log(`Demande déjà existante pour l'email: ${email}`);
                return res.json({ status: 'error', message: 'Vous avez déjà fait une demande de réinitialisation.' });
            } else {
                console.log(`Aucune demande existante pour l'email: ${email}`);
                return res.json({ status: 'success', message: 'Aucune demande trouvée pour cet email.' });
            }
        } catch (parseError) {
            console.error('Erreur lors de l\'analyse de fp.json :', parseError);
            return res.status(500).json({ status: 'error', message: 'Erreur de parsing de fp.json.' });
        }
    });
});


app.post('/reset-password-request', (req, res) => {
    const { email } = req.body;

    // Vérifie que l'email est fourni
    if (!email) {
        return res.status(400).json({ status: 'error', message: 'L\'email est requis.' });
    }

    fs.readFile(formateursFilePath, 'utf8', (err, formateursData) => {
        if (err) {
            console.error('Erreur lors de la lecture de formateurs.json :', err);
            return res.status(500).json({ status: 'error', message: 'Erreur du serveur' });
        }

        let formateurs;
        try {
            formateurs = JSON.parse(formateursData).formateurs;
        } catch (parseError) {
            console.error('Erreur lors du parsing de formateurs.json :', parseError);
            return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse des formateurs.' });
        }

        const formateur = formateurs.find(f => f.mail === email);
        if (!formateur) {
            console.error(`Formateur non trouvé avec l'email: ${email}`);
            return res.status(404).json({ status: 'error', message: 'Formateur non trouvé' });
        }

        // Ajouter la demande dans fp.json
        fs.readFile(fpFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture de fp.json :', err);
                return res.status(500).json({ status: 'error', message: 'Erreur du serveur' });
            }

            let requests;
            try {
                requests = JSON.parse(data).demandes;
            } catch (parseError) {
                console.error('Erreur lors du parsing de fp.json :', parseError);
                return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse des demandes.' });
            }

            // Vérifier si la demande existe déjà
            if (requests.some(request => request.mail === email)) {
                return res.status(400).json({ status: 'error', message: 'Une demande de réinitialisation existe déjà pour cet email.' });
            }

            // Ajouter une nouvelle demande de réinitialisation avec nom et prénom
            requests.push({
                mail: email,
                date: new Date().toISOString(),
                formateur_nom: formateur.nom, // Ajouter le nom
                formateur_prenom: formateur.prenom // Ajouter le prénom
            });

            // Sauvegarder les nouvelles demandes dans fp.json
            fs.writeFile(fpFilePath, JSON.stringify({ demandes: requests }, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Erreur lors de l\'écriture dans fp.json :', writeErr);
                    return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'écriture des demandes.' });
                }

                console.log(`Demande de réinitialisation enregistrée pour l'email: ${email}`);
                res.status(200).json({ status: 'success', message: 'Demande de réinitialisation enregistrée.' });
            });
        });
    });
});





// Fonction pour enregistrer la déconnexion et calculer la durée
function logAdminLogout(adminName, loginTime) {
    const logoutTime = new Date();
    const duration = Math.floor((logoutTime - new Date(loginTime)) / 60000); // Durée en minutes

    const logEntry = {
        username: adminName,
        loginTime: loginTime,
        logoutTime: logoutTime.toISOString(),
        duration: `${duration} minutes`
    };

    // Lire le fichier log_admin.json ou créer un tableau de logs s'il n'existe pas
    fs.readFile(logAdminFilePath, 'utf8', (err, data) => {
        let logs = { logins: [] };

        if (!err) {
            try {
                logs = JSON.parse(data);
            } catch (parseError) {
                console.error('Erreur lors du parsing de log_admin.json:', parseError);
            }
        } else if (err.code === 'ENOENT') {
            console.log('Fichier log_admin.json non trouvé, création d\'un nouveau fichier.');
        } else {
            console.error('Erreur lors de la lecture de log_admin.json:', err);
            return;
        }

        // Ajouter la nouvelle entrée de log
        logs.logins.push(logEntry);

        // Écrire les logs mis à jour dans log_admin.json
        fs.writeFile(logAdminFilePath, JSON.stringify(logs, null, 2), (err) => {
            if (err) {
                console.error('Erreur lors de l\'écriture dans log_admin.json :', err);
            } else {
                console.log('Déconnexion admin enregistrée avec succès dans log_admin.json');
            }
        });
    });
}

// Route de connexion admin (enregistre l'heure de connexion dans la session)
app.post('/login/admin', (req, res) => {
    const { username, password } = req.body;

    jsonfile.readFile(dbFilePath, (err, data) => {
        if (err) {
            res.status(500).send('Error reading database file');
            return;
        }

        const admin = data.admins.find(admin => admin.username === username);
        if (admin && password === admin.password) {
            req.session.user = admin;
            req.session.role = 'admin';
            req.session.loginTime = new Date().toISOString(); // Enregistre l'heure de connexion

            res.redirect('/admin/dashboard');
        } else {
            res.send('Nom d\'utilisateur ou mot de passe incorrect');
        }
    });
});


// Fonction pour enregistrer les connexion/déconnexions des formateurs et calculer la durée
// Fonction pour enregistrer la déconnexion et calculer la durée
// Fonction pour enregistrer la déconnexion et calculer la durée pour les formateurs
function logFormateurLogout(formateurName, loginTime) {
    const logoutTime = new Date();
    const duration = Math.floor((logoutTime - new Date(loginTime)) / 60000); // Durée en minutes

    const logEntry = {
        username: formateurName,
        loginTime: loginTime,
        logoutTime: logoutTime.toISOString(),
        duration: `${duration} minutes`
    };

    // Lire le fichier log_formateur.json ou créer un tableau de logs s'il n'existe pas
    fs.readFile(logFormateurFilePath, 'utf8', (err, data) => {
        let logs = { logins: [] };

        if (!err) {
            try {
                logs = JSON.parse(data);
            } catch (parseError) {
                console.error('Erreur lors du parsing de log_formateur.json:', parseError);
            }
        } else if (err.code === 'ENOENT') {
            console.log('Fichier log_formateur.json non trouvé, création d\'un nouveau fichier.');
        } else {
            console.error('Erreur lors de la lecture de log_formateur.json:', err);
            return;
        }

        // Ajouter la nouvelle entrée de log
        logs.logins.push(logEntry);

        // Écrire les logs mis à jour dans log_formateur.json
        fs.writeFile(logFormateurFilePath, JSON.stringify(logs, null, 2), (err) => {
            if (err) {
                console.error('Erreur lors de l\'écriture dans log_formateur.json :', err);
            } else {
                console.log('Déconnexion formateur enregistrée avec succès dans log_formateur.json');
            }
        });
    });
}


// Route de connexion du formateur (enregistre l'heure de connexion dans la session)
app.post('/login/formateur', (req, res) => {
    const { username, password } = req.body;

    fs.readFile(formateursFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de formateurs.json :', err);
            return res.status(500).send('Erreur serveur.');
        }

        const formateurs = JSON.parse(data).formateurs;
        const formateur = formateurs.find(f => f.mail === username && f.password === password);

        if (formateur) {
            // Enregistrer les données du formateur dans la session
            req.session.user = {
                id: formateur.id, // ID unique
                email: formateur.mail,
                role: 'formateur'
            };

            res.json({
                status: 'success',
                formateur: {
                    id: formateur.id,
                    nom: formateur.nom,
                    prenom: formateur.prenom
                }
            });
        } else {
            res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect.');
        }
    });
});


app.post('/update-formateur-info', (req, res) => {
    const { ville, telephone, mail, adresse, cp } = req.body;
    const formateurId = req.session.user?.id; // Récupère l'ID du formateur connecté

    if (!formateurId) {
        return res.status(401).json({ status: 'error', message: 'Utilisateur non authentifié.' });
    }

    fs.readFile(formateursFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de formateurs.json :', err);
            return res.status(500).json({ status: 'error', message: 'Erreur serveur.' });
        }

        let formateurs;
        try {
            formateurs = JSON.parse(data).formateurs;
        } catch (parseError) {
            console.error('Erreur lors de l\'analyse de formateurs.json :', parseError);
            return res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse des formateurs.' });
        }

        const formateur = formateurs.find(f => f.id === formateurId);

        if (!formateur) {
            return res.status(404).json({ status: 'error', message: 'Formateur non trouvé.' });
        }

        // Mettre à jour les informations du formateur avec la bonne clé
        formateur.ville = ville;
        formateur["téléphone"] = telephone; // Utilisation explicite de "téléphone"
        formateur.mail = mail;
        formateur.adresse = adresse;
        formateur.cp = cp;

        fs.writeFile(formateursFilePath, JSON.stringify({ formateurs }, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Erreur lors de l\'écriture dans formateurs.json :', writeErr);
                return res.status(500).json({ status: 'error', message: 'Erreur lors de la mise à jour des formateurs.' });
            }

            res.status(200).json({ status: 'success', message: 'Informations mises à jour avec succès.', formateur });
        });
    });
});









app.get('/api/formateur-data', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'formateur') {
        return res.status(403).json({ status: 'error', message: 'Accès refusé.' });
    }

    const formateurId = req.session.user.id; // Récupère l'ID du formateur connecté

    fs.readFile(formateursFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de formateurs.json :', err);
            return res.status(500).json({ status: 'error', message: 'Erreur serveur.' });
        }

        const formateurs = JSON.parse(data).formateurs;
        const formateur = formateurs.find(f => f.id === formateurId);

        if (formateur) {
            res.json({ status: 'success', formateur });
        } else {
            res.status(404).json({ status: 'error', message: 'Formateur non trouvé.' });
        }
    });
});

app.use(session({
    secret: 'your_secret_key', // Clé secrète pour signer les sessions
    resave: false, // Ne pas ré-enregistrer la session si aucune modification
    saveUninitialized: false, // Ne pas enregistrer les sessions vides
    cookie: {
        secure: false, // Mettez `true` si vous utilisez HTTPS
        httpOnly: true, // Protéger les cookies contre les attaques XSS
        maxAge: 3600000 // Durée de vie de la session (1 heure ici)
    }
}));


// Route de déconnexion du formateur (enregistre la déconnexion)
app.post('/logout', (req, res) => {
    const role = req.session.role;
    const loginTime = req.session.loginTime;

    if (role === 'formateur' && req.session.user) {
        const formateurName = req.session.user.nom;
        console.log(`Déconnexion du formateur ${formateurName}`);
        logFormateurLogout(formateurName, loginTime); // Enregistrer la déconnexion du formateur

    } else if (role === 'admin' && req.session.user) {
        const adminName = req.session.user.username;
        console.log(`Déconnexion de l'admin ${adminName}`);
        logAdminLogout(adminName, loginTime); // Enregistrer la déconnexion de l'admin
    } else {
        console.log('Pas d\'informations disponibles pour l\'utilisateur déconnecté.');
    }

    // Détruire la session
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la destruction de la session:', err);
            return res.status(500).send('Erreur lors de la déconnexion.');
        }
        res.send('Déconnexion réussie.');
    });
});




// Route pour assigner un formateur à un thème
app.post('/assign-formateur-to-theme', (req, res) => {
    const { formateurId, themeId } = req.body;

    if (!formateurId || !themeId) {
        return res.status(400).json({ success: false, message: 'Formateur ID et Thème ID sont requis' });
    }

    // Lire le fichier formateurs.json
    fs.promises.readFile(formateursFilePath, 'utf8')
        .then(data => {
            let formateursData = JSON.parse(data);
            let formateur = formateursData.formateurs.find(f => f.id === formateurId);

            if (!formateur) {
                throw new Error('Formateur non trouvé');
            }

            // Assigner le thème au formateur s'il n'est pas déjà assigné
            if (!formateur.themes) {
                formateur.themes = [];
            }

            if (!formateur.themes.includes(themeId)) {
                formateur.themes.push(themeId);
            }

            // Sauvegarder les modifications dans formateurs.json
            return fs.promises.writeFile(formateursFilePath, JSON.stringify(formateursData, null, 2));
        })
        .then(() => {
            res.json({ success: true, message: 'Formateur assigné au thème avec succès' });
        })
        .catch(err => {
            console.error('Erreur lors de l\'assignation du formateur au thème :', err);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        });
});

app.use(express.static('public'));

// Route pour servir dltEvents.json
app.get('/dltEvents.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'dltEvents.json'));
});

// Route pour restaurer un événement depuis dltEvents.json
app.post('/restore-event', (req, res) => {
    const { eventId } = req.body;

    Promise.all([
        fs.promises.readFile(eventsFilePath, 'utf8'),
        fs.promises.readFile(deletedEventsFilePath, 'utf8')
    ])
    .then(([eventsData, deletedEventsData]) => {
        const events = JSON.parse(eventsData).events;
        const deletedEvents = JSON.parse(deletedEventsData).deletedEvents || [];

        const eventToRestore = deletedEvents.find(e => e.id === eventId);
        if (!eventToRestore) {
            throw new Error('Événement non trouvé dans les événements archivés');
        }

        // Restaurer l'événement
        events.push(eventToRestore);

        // Supprimer l'événement des événements archivés
        const updatedDeletedEvents = deletedEvents.filter(e => e.id !== eventId);

        return Promise.all([
            fs.promises.writeFile(eventsFilePath, JSON.stringify({ events: events }, null, 2)),
            fs.promises.writeFile(deletedEventsFilePath, JSON.stringify({ deletedEvents: updatedDeletedEvents }, null, 2))
        ]);
    })
    .then(() => {
        res.json({ message: 'Événement restauré avec succès' });
    })
    .catch(err => {
        console.error('Erreur lors de la restauration de l\'événement :', err);
        res.status(500).send('Erreur lors de la restauration de l\'événement');
    });
});

// Middleware pour vérifier si l'utilisateur est authentifié en tant qu'admin
function checkAdminAuth(req, res, next) {
    if (req.session && req.session.user && req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/admin/login_admin.html');
    }
}



// Route pour mettre à jour toutes les données sauf les administrateurs
app.post('/update', (req, res) => {
    const { themes, formateurs, events } = req.body;

    Promise.all([
        fs.promises.readFile(themesFilePath, 'utf8'),
        fs.promises.readFile(formateursFilePath, 'utf8'),
        fs.promises.readFile(eventsFilePath, 'utf8')
    ])
    .then(([themesData, formateursData, eventsData]) => {
        const updatedThemes = themes || JSON.parse(themesData).themes;
        const updatedFormateurs = formateurs || JSON.parse(formateursData).formateurs;
        const updatedEvents = events || JSON.parse(eventsData).events;

        return Promise.all([
            fs.promises.writeFile(themesFilePath, JSON.stringify({ themes: updatedThemes }, null, 2)),
            fs.promises.writeFile(formateursFilePath, JSON.stringify({ formateurs: updatedFormateurs }, null, 2)),
            fs.promises.writeFile(eventsFilePath, JSON.stringify({ events: updatedEvents }, null, 2))
        ]);
    })
    .then(() => {
        res.json({ message: 'Data updated successfully' });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Error updating database files');
    });
});

// Route pour déplacer un événement supprimé vers dltEvents.json
app.post('/move-to-deleted-events', (req, res) => {
    const { event } = req.body;

    Promise.all([
        fs.promises.readFile(eventsFilePath, 'utf8'),
        fs.promises.readFile(deletedEventsFilePath, 'utf8')
    ])
    .then(([eventsData, deletedEventsData]) => {
        const events = JSON.parse(eventsData).events;
        const deletedEvents = JSON.parse(deletedEventsData).deletedEvents || [];

        // Supprimer l'événement de events.json
        const updatedEvents = events.filter(e => e.id !== event.id);

        // Ajouter l'événement à dltEvents.json
        deletedEvents.push(event);

        return Promise.all([
            fs.promises.writeFile(eventsFilePath, JSON.stringify({ events: updatedEvents }, null, 2)),
            fs.promises.writeFile(deletedEventsFilePath, JSON.stringify({ deletedEvents }, null, 2))
        ]);
    })
    .then(() => {
        res.json({ message: 'Event moved to deleted events successfully' });
    })
    .catch(err => {
        console.error('Erreur lors de la mise à jour des événements supprimés :', err);
        res.status(500).send('Error moving event to deleted events');
    });
});

// Route pour envoyer un message (messagerie formateur)
app.post('/send-message', (req, res) => {
    const { subject, message, attachments, formation } = req.body;
    const formateur = req.session.user;

    if (!formateur) {
        res.status(401).send('User not authenticated');
        return;
    }

    const newMessage = {
        id: Date.now(),
        subject,
        content: message,
        attachments: JSON.parse(attachments),
        sender: formateur.nom,
        date: new Date().toISOString(),
        event_id: formation ? parseInt(formation, 10) : null,
        theme_id: null,
    };

    fs.promises.readFile(eventsFilePath, 'utf8')
    .then(data => {
        const events = JSON.parse(data).events;
        if (newMessage.event_id) {
            const event = events.find(e => e.id === newMessage.event_id);
            newMessage.theme_id = event ? event.theme_id : null;
        }

        return fs.promises.readFile(dbFilePath, 'utf8');
    })
    .then(data => {
        const dbData = JSON.parse(data);
        dbData.messages.push(newMessage);

        return fs.promises.writeFile(dbFilePath, JSON.stringify(dbData, null, 2));
    })
    .then(() => {
        res.json({ message: 'Message sent successfully' });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Error sending message');
    });
});

// Routes statiques pour la messagerie
app.use('/formateurs/messagerie', express.static(path.join(__dirname, 'public/formateurs/messagerie')));

// Route pour servir les fichiers JSON
app.get('/db.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'db.json'));
});

app.get('/formateurs.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'formateurs.json'));
});

app.get('/themes.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'themes.json'));
});

app.get('/events.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'events.json'));
});

// Route pour vérifier l'authentification de l'admin
app.post('/check-auth', (req, res) => {
    if (req.session && req.session.user && req.session.role === 'admin') {
        res.json({ authenticated: true, username: req.session.user.username });
    } else {
        res.json({ authenticated: false });
    }
});

// Authentification et routes de dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/formateurs/login.html'));
});


app.get('/admin/login_admin.html', (req, res) => {
    res.sendFile(__dirname + '/public/admin/login_admin.html');
});

app.get('/formateurs/login.html', (req, res) => {
    res.sendFile(__dirname + '/public/formateurs/login.html');
});

// Routes pour authentification (admin et formateur)
app.post('/login/admin', (req, res) => {
    const { username, password } = req.body;

    jsonfile.readFile(dbFilePath, (err, data) => {
        if (err) {
            res.status(500).send('Error reading database file');
            return;
        }

        const admin = data.admins.find(admin => admin.username === username);
        if (admin && password === admin.password) {
            req.session.user = admin;
            req.session.role = 'admin';
            req.session.loginTime = new Date().toISOString(); // Enregistre l'heure de connexion

            res.redirect('/admin/dashboard');
        } else {
            res.send('Nom d\'utilisateur ou mot de passe incorrect');
        }
    });
});

app.post('/login/formateur', (req, res) => {
    const { username, password } = req.body;

    jsonfile.readFile(formateursFilePath, (err, data) => {
        if (err) {
            res.status(500).send('Error reading database file');
            return;
        }

        const formateur = data.formateurs.find(formateur => formateur.mail === username);
        if (formateur && password === formateur.password) {
            req.session.user = formateur;
            req.session.role = 'formateur';
            res.json({
                status: 'success',
                formateur: {
                    id: formateur.id,
                    nom: formateur.nom,
                    prenom: formateur.prenom
                }
            });
        } else {
            res.send('Nom d\'utilisateur ou mot de passe incorrect');
        }
    });
});

// Dashboard routes
app.get('/admin/dashboard', (req, res) => {
    if (req.session.role === 'admin') {
        res.sendFile(__dirname + '/public/admin/acc_admin.html');
    } else {
        res.send('Accès refusé');
    }
});

app.get('/formateur/dashboard', (req, res) => {
    if (req.session.role === 'formateur') {
        res.sendFile(__dirname + '/public/formateurs/accueil_formateur.html');
    } else {
        res.send('Accès refusé');
    }
});

// Route de déconnexion
app.post('/logout', (req, res) => {
    const adminName = req.session.user?.username;
    const loginTime = req.session.loginTime;

    if (adminName && loginTime) {
        console.log('Admin déconnecté:', adminName);
        logAdminLogout(adminName, loginTime); // Appel de la fonction pour loguer la déconnexion
    } else {
        console.log('Pas d\'informations d\'admin ou de loginTime disponibles.');
    }

    // Détruire la session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion.');
        }
        res.send('Déconnexion réussie.');
    });
});


// Route pour servir themeforma.html avec authentification d'admin

app.use('addformateurs/addformateur', express.static(path.join(__dirname, '/addformateur/addformateur')));

// Route pour mettre à jour les indisponibilités du formateur
app.post('/update-indisponibilites', (req, res) => {
    const { formateurId, indisponibilites } = req.body;

    if (!formateurId || !indisponibilites) {
        return res.status(400).json({ success: false, message: 'Formateur ID et indisponibilités sont requis' });
    }

    // Lire le fichier formateurs.json
    fs.promises.readFile(formateursFilePath, 'utf8')
        .then(data => {
            let formateursData = JSON.parse(data);
            let formateur = formateursData.formateurs.find(f => f.id === formateurId);

            if (!formateur) {
                throw new Error('Formateur non trouvé');
            }

            // Mettre à jour les indisponibilités du formateur
            formateur.indisponibilites = indisponibilites;

            // Sauvegarder les modifications dans formateurs.json
            return fs.promises.writeFile(formateursFilePath, JSON.stringify(formateursData, null, 2));
        })
        .then(() => {
            res.json({ success: true, message: 'Indisponibilités mises à jour avec succès' });
        })
        .catch(err => {
            console.error('Erreur lors de la mise à jour des indisponibilités :', err);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        });
});

// Démarrer le serveur sur le port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur WebSocket démarré sur http://localhost:${PORT}`);
});
