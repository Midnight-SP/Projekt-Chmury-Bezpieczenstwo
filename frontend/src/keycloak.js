import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: window.location.origin,
  realm: 'projekt',
  clientId: 'frontend',
  flow: 'standard',
  pkceMethod: 'S256'
});

export default keycloak;