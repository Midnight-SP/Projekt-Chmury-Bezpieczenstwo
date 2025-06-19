const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

module.exports = jwt({
  // pobieraj JWKS z właściwego serwisu keycloak w klastrze
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`
  }),
  algorithms: ['RS256'],
  // nie sprawdzaj issuer/audience
  getToken: req => {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) return h.slice(7);
    return null;
  }
});