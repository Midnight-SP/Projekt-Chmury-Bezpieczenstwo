// src/App.js
import React, { useEffect, useState } from 'react';
import keycloak from './keycloak';

function App() {
  const [auth, setAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  // const [users, setUsers] = useState([]);   // ← można usunąć lub zostawić nieużywane

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', checkLoginIframe: false, pkceMethod: 'S256' })
      .then((authenticated) => {
        if (!authenticated) return;
        setAuth(true);

        // PRODUCTS
        fetch('/products', {
          headers: { Authorization: 'Bearer ' + keycloak.token }
        })
          .then(r => r.ok ? r.json() : [])
          .then(data => setProducts(
            Array.isArray(data)
              ? data.map(p => ({ ...p, price: Number(p.price) }))
              : []
          ))
          .catch(() => setProducts([]));

        // KC-USERS – tymczasowo wyłączone
        // fetch('/kc-users', {
        //   headers: { Authorization: 'Bearer ' + keycloak.token }
        // })
        //   .then(r => r.ok ? r.json() : [])
        //   .then(setUsers)
        //   .catch(() => setUsers([]));
      });
  }, []);

  const addToCart = p => {
    setCart([...cart, { productId: p.id, name: p.name, price: p.price, qty: 1 }]);
  };

  const checkout = () => {
    fetch('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + keycloak.token
      },
      body: JSON.stringify({ items: cart.map(c=>({ productId: c.productId, quantity: c.qty })) })
    })
      .then(r => r.json())
      .then(o => alert('Zamówienie #' + o.orderId + ' utworzone!'))
      .catch(() => alert('Błąd zamówienia'));
  };

  if (!auth) return <div>Ładowanie...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Sklepik</h1>

      {/*
      <h2>Użytkownicy Keycloak</h2>
      <ul>
        {users.map(u => <li key={u.id}>{u.username} ({u.email})</li>)}
      </ul>
      */}

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <h2>Produkty</h2>
          <ul>
            {products.map(p =>
              <li key={p.id}>
                {p.name} – {p.price.toFixed(2)} zł
                <button onClick={() => addToCart(p)}>Dodaj</button>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2>Koszyk</h2>
          <ul>
            {cart.map((c,i)=>
              <li key={i}>{c.name} x{c.qty} – {(c.price*c.qty).toFixed(2)} zł</li>
            )}
          </ul>
          {cart.length>0 && <button onClick={checkout}>Zamów</button>}
        </div>
      </div>
      <button onClick={() => keycloak.logout()}>Wyloguj</button>
    </div>
  );
}

export default App;