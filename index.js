importer express depuis 'express';
importer fetch depuis 'node-fetch';

const app = express();
app.use(express.json());

// Le token maître MetaApi n'est JAMAIS écrit en dur ici — il est fourni par
// une variable d'environnement, configurée uniquement sur le serveur
// (Render/Railway), jamais dans le code source ni dans l'app mobile.
const METAAPI_TOKEN = process.env.METAAPI_TOKEN;

const PROVISIONING_BASE = ' https://mt-provisioning-api- v1.agiliumtrade.agiliumtrade. ai ';

si (!METAAPI_TOKEN) {
  console.warn('ATTENTION: la variable d\'environnement METAAPI_TOKEN n\'est pas définie.');
}

/**
 * Crée un compte MetaApi pour un client, à partir de ses identifiants
 * MT4/MT5 (login, mot de passe, serveur). Le client n'a jamais besoin de
 * connaître MetaApi ni un quelconque token.
 */
app.post ('/provision', async (req, res) => {
  const { login, password, server, platform } = req.body;
  si (!identifiant || !mot de passe || !serveur || !plateforme) {
    return res.status(400).json({ error: 'login, password, server et platform sont requis.' });
  }

  essayer {
    const response = await fetch(`${PROVISIONING_BASE}/ users/current/accounts`, {
      méthode : 'POST',
      en-têtes : {
        'Type de contenu' : 'application/json',
        'auth-token': METAAPI_TOKEN,
      },
      corps : JSON.stringify({
        se connecter,
        mot de passe,
        serveur,
        plateforme, // 'mt4' ou 'mt5'
        nom : `client-${login}`,
        magie : 0,
        reliability: 'regular', // fiabilité gratuite — évite les frais "high reliability"
      }),
    });

    const data = await response.json();
    si (!response.ok) {
      return res.status(response.status) .json({ error: data.message || 'Erreur MetaApi', details: data });
    }

    // On ne renvoie QUE l'ID du compte — jamais le token maître.
    renvoie res.json({ accountId: data.id });
  } attraper (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/** Récupère la région d'hébergement d'un compte (nécessaire pour l'étape suivante). */
fonction asynchrone fetchRegion(accountId) {
  const response = await fetch(`${PROVISIONING_BASE}/ users/current/accounts/${ accountId}`, {
    en-têtes : { 'auth-token' : METAAPI_TOKEN },
  });
  si (!response.ok) retourner null ;
  const data = await response.json();
  renvoyer les données.région ;
}

/** Consulte le solde/equity/broker d'un compte client, par son accountId. */
app.get('/account-info/: accountId', async (req, res) => {
  const { accountId } = req.params;
  essayer {
    const région = await fetchRegion(accountId);
    si (!région) {
      return res.status(404).json({ error: 'Compte introuvable chez MetaApi.' });
    }

    const réponse = attendre la récupération(
      ` https://mt-client-api-v1. ${ region}. agiliumtrade.ai/users/ current/accounts/${accountId}/ account-information` ,
      { headers: { 'auth-token': METAAPI_TOKEN } }
    );
    const data = await response.json();
    si (!response.ok) {
      return res.status(response.status) .json({ error: data.message || 'Erreur MetaApi', details: data });
    }
    renvoyer res.json(données);
  } attraper (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/**
 * Exécute un ordre réel sur le compte du client. Ne JAMAIS appeler ceci
 * sans confirmation explicite de l'utilisateur côté app — c'est de
 * l'argent réel.
 */
app.post ('/trade/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const { actionType, symbol, volume, stopLoss, takeProfit, openPrice } = req.body;

  si (!actionType || !symbol || !volume) {
    return res.status(400).json({ error: 'actionType, symbol et volume sont requis.' });
  }

  essayer {
    const région = await fetchRegion(accountId);
    si (!région) {
      return res.status(404).json({ error: 'Compte introuvable chez MetaApi.' });
    }

    const body = { actionType, symbol, volume, comment: 'IA sans perte par ManuForex' };
    si (stopLoss) corps.stopLoss = stopLoss ;
    si (prendreProfit) corps.prendreProfit = prendreProfit;
    if (openPrice) body.openPrice = openPrice; // requis pour les ordres LIMIT/STOP

    const réponse = attendre la récupération(
      ` https://mt-client-api-v1. ${ region}. agiliumtrade.ai/users/ current/accounts/${accountId}/ trade` ,
      {
        méthode : 'POST',
        en-têtes : { 'Content-Type' : 'application/json', 'auth-token' : METAAPI_TOKEN },
        corps : JSON.stringify(corps),
      }
    );
    const data = await response.json();
    si (!response.ok) {
      return res.status(response.status) .json({ error: data.message || 'Erreur MetaApi', details: data });
    }
    renvoyer res.json(données);
  } attraper (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.get('/', (req, res) => res.send('ManuForex MT5 backend actif.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
