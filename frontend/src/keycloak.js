import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://127.0.0.1/',
  realm: 'projekt',
  clientId: 'frontend',
});

export default keycloak;