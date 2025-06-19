const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

module.exports = jwt({
  // pobieraj klucze JWKS z Keycloak
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`
  }),
  issuer:  process.env.KEYCLOAK_ISSUER,
  algorithms: ['RS256'],
});