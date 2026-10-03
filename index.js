import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Le token maître MetaApi n'est JAMAIS écrit en dur ici — il est fourni par
// une variable d'environnement, configurée uniquement sur le serveur
// (Render/Railway), jamais dans le code source ni dans l'app mobile.
const METAAPI_TOKEN = process.env.METAAPI_TOKEN;

const PROVISIONING_BASE = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

if (!METAAPI_TOKEN) {
  console.warn('ATTENTION: la variable d\'environnement METAAPI_TOKEN n\'est pas définie.');
}

/**
 * Crée un compte MetaApi pour un client, à partir de ses identifiants
 * MT4/MT5 (login, mot de passe, serveur). Le client n'a jamais besoin de
 * connaître MetaApi ni un quelconque token.
 */
app.post('/provision', async (req, res) => {
  const { login, password, server, platform } = req.body;
  if (!login || !password || !server || !platform) {
    return res.status(400).json({ error: 'login, password, server et platform sont requis.' });
  }

  try {
    const response = await fetch(`${PROVISIONING_BASE}/users/current/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': METAAPI_TOKEN,
      },
      body: JSON.stringify({
        login,
        password,
        server,
        platform, // 'mt4' ou 'mt5'
        name: `client-${login}`,
        magic: 0,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erreur MetaApi', details: data });
    }

    // On ne renvoie QUE l'ID du compte — jamais le token maître.
    return res.json({ accountId: data.id });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

/** Récupère la région d'hébergement d'un compte (nécessaire pour l'étape suivante). */
async function fetchRegion(accountId) {
  const response = await fetch(`${PROVISIONING_BASE}/users/current/accounts/${accountId}`, {
    headers: { 'auth-token': METAAPI_TOKEN },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.region;
}

/** Consulte le solde/equity/broker d'un compte client, par son accountId. */
app.get('/account-info/:accountId', async (req, res) => {
  const { accountId } = req.params;
  try {
    const region = await fetchRegion(accountId);
    if (!region) {
      return res.status(404).json({ error: 'Compte introuvable chez MetaApi.' });
    }

    const response = await fetch(
      `https://mt-client-api-v1.${region}.agiliumtrade.ai/users/current/accounts/${accountId}/account-information`,
      { headers: { 'auth-token': METAAPI_TOKEN } }
    );
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erreur MetaApi', details: data });
    }
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.get('/', (req, res) => res.send('ManuForex MT5 backend actif.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
