import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const METAAPI_TOKEN = process.env.METAAPI_TOKEN;
const PROVISIONING_BASE = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

if (!METAAPI_TOKEN) {
  console.warn('ATTENTION: la variable d\'environnement METAAPI_TOKEN n\'est pas définie.');
}

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
        platform,
        name: `client-${login}`,
        magic: 0,
        reliability: 'regular',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erreur MetaApi', details: data });
    }

    return res.json({ accountId: data.id });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

async function fetchRegion(accountId) {
  const response = await fetch(`${PROVISIONING_BASE}/users/current/accounts/${accountId}`, {
    headers: { 'auth-token': METAAPI_TOKEN },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.region;
}

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

app.post('/trade/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const { actionType, symbol, volume, stopLoss, takeProfit, openPrice } = req.body;

  if (!actionType || !symbol || !volume) {
    return res.status(400).json({ error: 'actionType, symbol et volume sont requis.' });
  }

  try {
    const region = await fetchRegion(accountId);
    if (!region) {
      return res.status(404).json({ error: 'Compte introuvable chez MetaApi.' });
    }

    const body = { actionType, symbol, volume, comment: 'No_Loss AI by ManuForex' };
    if (stopLoss) body.stopLoss = stopLoss;
    if (takeProfit) body.takeProfit = takeProfit;
    if (openPrice) body.openPrice = openPrice;

    const response = await fetch(
      `https://mt-client-api-v1.${region}.agiliumtrade.ai/users/current/accounts/${accountId}/trade`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'auth-token': METAAPI_TOKEN },
        body: JSON.stringify(body),
      }
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
