// src/App.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient"; // the file above

const STORAGE_KEY = "simple_cart_v1";

function currency(n) {
  return `₹${Number(n).toFixed(2)}`;
}

function useHashRoute(defaultRoute = "menu") {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || defaultRoute);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace("#", "") || defaultRoute);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultRoute]);
  const navigate = (r) => (window.location.hash = r);
  return { route, navigate };
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function MenuPage({ menu, onAdd }) {
  const [quantities, setQuantities] = useState(() => {
    const q = {};
    (menu || []).forEach((m) => (q[m.id] = 1));
    return q;
  });

  useEffect(() => {
    // keep quantity defaults in sync when menu loads/changes
    const q = {};
    (menu || []).forEach((m) => (q[m.id] = 1));
    setQuantities((s) => ({ ...q, ...s }));
  }, [menu]);

  const inc = (id) => setQuantities((s) => ({ ...s, [id]: Math.max(1, s[id] + 1) }));
  const dec = (id) => setQuantities((s) => ({ ...s, [id]: Math.max(1, s[id] - 1) }));
  const setQ = (id, val) => setQuantities((s) => ({ ...s, [id]: Math.max(1, Number(val) || 1) }));

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Menu</h1>
      {menu.length === 0 && <p>Loading menu...</p>}
      <div style={styles.grid}>
        {menu.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.rowSpace}>
              <strong>{item.name}</strong>
              <span>{currency(item.price)}</span>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: "#555" }}>{item.description || ""}</div>
            </div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => dec(item.id)} style={styles.qtyBtn}>-</button>
              <input
                type="number"
                min={1}
                value={quantities[item.id] || 1}
                onChange={(e) => setQ(item.id, e.target.value)}
                style={styles.qtyInput}
              />
              <button onClick={() => inc(item.id)} style={styles.qtyBtn}>+</button>

              <button
                onClick={() => onAdd({ ...item, qty: Number(quantities[item.id] || 1) })}
                style={styles.addBtn}
              >
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartPage({ cart, onUpdateQty, onRemove, onClear, onCheckout, checkoutLoading }) {
  const subtotal = cart.reduce((s, it) => s + it.qty * it.price, 0);

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Your Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div style={{ width: "100%", maxWidth: 800 }}>
          {cart.map((item) => (
            <div key={item.id} style={styles.cartRow}>
              <div>
                <strong>{item.name}</strong>
                <div style={{ fontSize: 13, color: "#555" }}>{currency(item.price)} each</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} style={styles.qtyBtn}>-</button>
                <input
                  type="number"
                  value={item.qty}
                  min={1}
                  onChange={(e) => onUpdateQty(item.id, Number(e.target.value) || 1)}
                  style={styles.qtyInput}
                />
                <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={styles.qtyBtn}>+</button>

                <div style={{ minWidth: 90, textAlign: "right" }}>{currency(item.qty * item.price)}</div>

                <button onClick={() => onRemove(item.id)} style={styles.removeBtn}>Remove</button>
              </div>
            </div>
          ))}

          <div style={styles.summary}>
            <div><strong>Subtotal:</strong></div>
            <div style={{ fontSize: 18 }}>{currency(subtotal)}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClear} style={styles.clearBtn}>Clear Cart</button>
            <button onClick={() => onCheckout(cart, subtotal)} style={styles.checkoutBtn} disabled={checkoutLoading}>
              {checkoutLoading ? "Placing order..." : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { route, navigate } = useHashRoute("menu");
  const [cart, setCart] = useState(loadCart);
  const [menu, setMenu] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => saveCart(cart), [cart]);

  // fetch menu from supabase
  useEffect(() => {
    let mounted = true;
    async function loadMenu() {
      try {
        const { data, error } = await supabase.from("menu").select("*").order("id");
        if (error) throw error;
        if (mounted) setMenu(data || []);
      } catch (err) {
        console.error("Failed to load menu:", err.message || err);
        // fallback: you can keep a local SAMPLE_MENU if desired
      }
    }
    loadMenu();
    return () => { mounted = false; };
  }, []);

  const addToCart = (item) => {
    setCart((c) => {
      const found = c.find((x) => x.id === item.id);
      if (found) {
        return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + item.qty } : x));
      }
      return [...c, { id: item.id, name: item.name, price: item.price, qty: item.qty }];
    });
  };

  const updateQty = (id, qty) => {
    setCart((c) => {
      if (qty <= 0) return c.filter((x) => x.id !== id);
      return c.map((x) => (x.id === id ? { ...x, qty } : x));
    });
  };

  const removeItem = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  // checkout -> insert order into supabase
  const handleCheckout = async (cartItems, subtotal) => {
    setCheckoutLoading(true);
    try {
      // insert into orders; .insert().select() returns the created row(s). See docs for insert + select.
      const { data, error } = await supabase
        .from("orders")
        .insert([{ items: cartItems, subtotal }])
        .select();

      if (error) throw error;
      // data contains the inserted order(s)
      alert("Order placed! id: " + (data?.[0]?.id ?? "unknown"));
      clearCart();
      navigate("menu");
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to place order: " + (err.message || err));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("menu")} style={styles.linkBtn}>Menu</button>
          <button onClick={() => navigate("cart")} style={styles.linkBtn}>Cart ({cart.reduce((s, it) => s + it.qty, 0)})</button>
        </div>
        <div style={{ fontSize: 13, color: "#333" }}>
          <strong>Simple Restaurant (Supabase)</strong>
        </div>
      </header>

      <main style={styles.main}>
        {route === "menu" && <MenuPage menu={menu} onAdd={addToCart} />}
        {route === "cart" && (
          <CartPage
            cart={cart}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onClear={clearCart}
            onCheckout={handleCheckout}
            checkoutLoading={checkoutLoading}
          />
        )}
      </main>

      <footer style={styles.footer}>Demo app — menu loaded from Supabase; orders saved to Supabase (orders table)</footer>
    </div>
  );
}

// ---- inline styles (same as before) ----
const styles = {
  app: { fontFamily: 'system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: '1px solid #eee' },
  main: { flex: 1, padding: 18, display: 'flex', justifyContent: 'center' },
  footer: { padding: 12, textAlign: 'center', fontSize: 13, color: '#666' },
  h1: { margin: 0, marginBottom: 8 },
  page: { width: '100%', maxWidth: 1000 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 },
  card: { padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fff' },
  rowSpace: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  qtyBtn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' },
  qtyInput: { width: 56, padding: 6, textAlign: 'center', borderRadius: 6, border: '1px solid #ddd' },
  addBtn: { marginLeft: 'auto', padding: '8px 12px', borderRadius: 6, border: 'none', background: '#2b8aef', color: '#fff', cursor: 'pointer' },
  cartRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #f0f0f0' },
  removeBtn: { padding: '6px 8px', border: '1px solid #e74c3c', background: '#fff', color: '#e74c3c', cursor: 'pointer', borderRadius: 6 },
  summary: { display: 'flex', justifyContent: 'space-between', padding: 12, marginTop: 12, borderTop: '1px solid #eee' },
  clearBtn: { padding: '8px 12px', borderRadius: 6, border: '1px solid #aaa', background: '#fff', cursor: 'pointer' },
  checkoutBtn: { padding: '8px 12px', borderRadius: 6, border: 'none', background: '#27ae60', color: '#fff', cursor: 'pointer' },
  linkBtn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }
};
