// src/App.js
import React, { useEffect, useState } from 'react';
import keycloak from './keycloak';

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).then(auth => {
      setAuthenticated(auth);
      if (auth) {
        // Możesz pobrać token: keycloak.token
        // I wysyłać go w Authorization: Bearer ... do backendu
        fetch('/users', {
          headers: {
            Authorization: 'Bearer ' + keycloak.token
          }
        })
      }
    });
  }, []);

  if (!authenticated) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div>
      <h1>Witaj, {keycloak.tokenParsed?.preferred_username}</h1>
      <button onClick={() => keycloak.logout()}>Wyloguj</button>
    </div>
  );
}

export default App;