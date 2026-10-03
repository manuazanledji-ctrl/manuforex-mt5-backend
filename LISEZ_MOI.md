# Backend MT5 — ManuForex AI

Ce petit serveur protège ton **token maître MetaApi** : il crée et consulte des
comptes MT4/MT5 pour tes clients, sans que ce token n'apparaisse jamais dans
l'app mobile (qui pourrait être décompilée).

## Déploiement sur Render (gratuit)

1. Crée un compte sur **render.com** (gratuit)
2. Comme pour l'app Flutter : crée un dépôt GitHub pour ce dossier (ex:
   `manuforex-mt5-backend`), uploade ces 3 fichiers dedans
3. Sur Render : **New** → **Web Service** → connecte ton dépôt GitHub
4. Render détecte automatiquement Node.js. Configure :
   - **Build command**: `npm install`
   - **Start command**: `npm start`
5. Dans l'onglet **Environment** de Render, ajoute une variable :
   - Clé : `METAAPI_TOKEN`
   - Valeur : **ton token maître MetaApi** (celui que tu as généré sur
     app.metaapi.cloud — à ne RENTRER QUE dans Render, jamais ailleurs)
6. Déploie. Render te donne une URL du style
   `https://manuforex-mt5-backend.onrender.com`

## Une fois déployé

Donne-moi cette URL — je mettrai à jour l'app Flutter pour qu'elle appelle
ton serveur au lieu de MetaApi directement, avec un simple formulaire
Login/Mot de passe/Serveur pour tes clients (comme RoboTrader).

## Note sur le plan gratuit de Render

Le plan gratuit met le serveur "en veille" après 15 minutes d'inactivité —
le premier appel après une pause peut prendre 30-50 secondes le temps qu'il
se réveille. Pour un usage de test, c'est très bien. Pour un vrai lancement
commercial, un plan payant (~7$/mois) évite ce délai.
