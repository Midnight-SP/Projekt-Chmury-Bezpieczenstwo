import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://127.0.0.1/',
  realm: 'projekt',
  clientId: 'frontend',
  flow: 'standard',
  pkceMethod: 'S256'
});

export default keycloak;