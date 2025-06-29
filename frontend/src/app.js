import React, { useEffect, useState } from 'react';
import keycloak from './keycloak';

function App() {
  const [auth, setAuth]         = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart]         = useState([]);

  // Keycloak initialization and fetching products
  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', checkLoginIframe: false, pkceMethod: 'S256' })
      .then(authenticated => {
        if (!authenticated) return;
        setAuth(true);

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
      });
  }, []);

  const addToCart = p => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.productId === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          qty: updated[idx].qty + 1 
        };
        return updated;
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const removeFromCart = productId => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.productId === productId);
      if (idx < 0) return prev;
      const updated = [...prev];
      if (updated[idx].qty > 1) {
        updated[idx] = { ...updated[idx], qty: updated[idx].qty - 1 };
      } else {
        updated.splice(idx, 1);
      }
      return updated;
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
    <>  
      <h1 style={{ textAlign:'center', margin:'1rem 0' }}>Sklepik</h1>
      <div className="flex-container">
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
                <button onClick={() => removeFromCart(c.productId)}>Usuń</button>
              </li>
            )}
          </ul>
          {cart.length > 0 && <>
            <button onClick={checkout}>Zamów</button>
            <div className="cart-total">
              <strong>Suma: </strong>
              {cart.reduce((sum, c) => sum + c.price * c.qty, 0).toFixed(2)} zł
            </div>
          </>}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={() => keycloak.logout()}>Wyloguj</button>
      </div>
    </>
  );
}

export default App;