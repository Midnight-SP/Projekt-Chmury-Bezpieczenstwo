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

        // Wydrukuj token do konsoli i przypisz do window, żeby było łatwo skopiować
        console.log('💠 Keycloak token:', keycloak.token);
        window.kcToken = keycloak.token;

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
    setCart(prev => {
      const idx = prev.findIndex(c => c.productId === p.id);
      if (idx >= 0) {
        // już jest → tylko zwiększamy qty
        const updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          qty: updated[idx].qty + 1 
        };
        return updated;
      }
      // nowy wpis
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
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
    <div className="flex-container">
      <h1>Sklepik</h1>
      <div className="products">
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
      <div className="cart">
        <h2>Koszyk</h2>
        <ul>
          {cart.map(c =>
            <li key={c.productId}>
              {c.name} x{c.qty} – {(c.price * c.qty).toFixed(2)} zł
            </li>
          )}
        </ul>
        {cart.length > 0 && <>
          <button onClick={checkout}>Zamów</button>
          <div className="cart-total">
            <strong>Suma: </strong>
            {cart
              .reduce((sum, c) => sum + c.price * c.qty, 0)
              .toFixed(2)
            } zł
          </div>
        </>}
      </div>
      <button onClick={() => keycloak.logout()}>Wyloguj</button>
    </div>
  );
}

export default App;