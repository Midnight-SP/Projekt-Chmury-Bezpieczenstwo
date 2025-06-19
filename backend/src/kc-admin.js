const fetch = require('node-fetch');
const qs = require('querystring');

const tokenUrl = `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
let adminToken, expiresAt=0;

async function getAdminToken() {
  if (Date.now() < expiresAt - 60000) return adminToken;
  const body = qs.stringify({
    grant_type: 'client_credentials',
    client_id:  process.env.KC_ADMIN_CLIENT_ID,
    client_secret: process.env.KC_ADMIN_CLIENT_SECRET
  });
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error_description||j.error);
  adminToken = j.access_token;
  expiresAt = Date.now() + j.expires_in*1000;
  return adminToken;
}

module.exports = { getAdminToken };