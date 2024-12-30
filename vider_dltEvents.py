import json
import schedule
import time
from datetime import datetime

# Chemin vers le fichier JSON
fichier_json = "dltEvents.json"

# Fonction pour vider le fichier JSON
def vider_fichier_json():
    with open(fichier_json, 'w') as fichier:
        json.dump({}, fichier)
    print(f"[{datetime.now()}] Le fichier {fichier_json} a été vidé.")

# Planifier l'exécution tous les 182 jours (environ 6 mois)
schedule.every(182).days.do(vider_fichier_json)

print("Le script est en cours d'exécution...")

# Boucle infinie pour garder le script actif
while True:
    schedule.run_pending()  # Vérifie si une tâche doit être exécutée
    time.sleep(1)  # Pause de 1 seconde entre les vérifications
