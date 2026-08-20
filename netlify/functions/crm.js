// netlify/functions/crm.js
//
// Petite fonction serverless qui stocke toutes les données du CRM
// (cibles ⭐, statuts de candidature, notes, contacts…) dans un seul
// blob JSON via Netlify Blobs. Pas de base de données à gérer :
// Netlify fournit automatiquement les identifiants nécessaires
// lorsque cette fonction tourne sur ton site déployé.
//
// GET  /.netlify/functions/crm   -> renvoie l'objet CRM complet ({} si vide)
// POST /.netlify/functions/crm   -> remplace l'objet CRM complet (body JSON)

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'annuaire-crm';
const BLOB_KEY = 'data';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  try {
    const store = getStore(STORE_NAME);

    if (event.httpMethod === 'GET') {
      const data = await store.get(BLOB_KEY, { type: 'json' });
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data || {}) };
    }

    if (event.httpMethod === 'POST') {
      let payload;
      try {
        payload = JSON.parse(event.body || '{}');
      } catch (parseErr) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: 'Corps de requête JSON invalide.' })
        };
      }
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: 'Le corps doit être un objet JSON.' })
        };
      }
      await store.setJSON(BLOB_KEY, payload);
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
    }

    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Méthode non autorisée.' })
    };
  } catch (err) {
    console.error('Erreur fonction crm:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Erreur serveur.' })
    };
  }
};
