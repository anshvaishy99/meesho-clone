/* storage.js - all localStorage access lives here. */
const KEYS = {
  products: "meesho_products", cart: "meesho_cart", wishlist: "meesho_wishlist",
  users: "meesho_users", currentUser: "meesho_current_user", addresses: "meesho_addresses",
  orders: "meesho_orders", coupons: "meesho_coupons", searches: "meesho_recent_searches",
  categories: "meesho_categories", recent: "meesho_recently_viewed", appliedCoupon: "meesho_applied_coupon",
  initialized: "meesho_initialized"
};
const DEMO_USER = { email: "demo@meesho.test", password: "Demo@123" };
const DEMO_ADMIN = { username: "admin", password: "Admin@123" };

/* DEMO-ONLY hash (cyrb53 + salt). NOT secure; it only avoids storing plain text. */
function demoHash(str) {
  const s = "meesho-demo-salt:" + str; let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const Store = {
  read(key, fallback) {
    try { const raw = localStorage.getItem(key); if (raw === null) return fallback; const v = JSON.parse(raw); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch (e) {} },
  arr(key) { const v = Store.read(key, []); return Array.isArray(v) ? v : []; },

  /* Seeds only on first launch (or if the product list is missing/corrupt). */
  init() {
    if (localStorage.getItem(KEYS.initialized) && Store.arr(KEYS.products).length) return;
    Store.seed();
  },
  seed() {
    Store.write(KEYS.products, buildDefaultProducts());
    Store.write(KEYS.categories, DEFAULT_CATEGORIES);
    Store.write(KEYS.coupons, [
      { code: "WELCOME10", type: "percent", value: 10, minOrder: 299, maxDiscount: 150, expiry: "2027-12-31", active: true, description: "10% off up to ₹150 on orders above ₹299" },
      { code: "SAVE100", type: "flat", value: 100, minOrder: 999, maxDiscount: 100, expiry: "2027-12-31", active: true, description: "Flat ₹100 off on orders above ₹999" },
      { code: "FREESHIP", type: "freeship", value: 0, minOrder: 199, maxDiscount: 0, expiry: "2027-12-31", active: true, description: "Free delivery on orders above ₹199" },
      { code: "OLD50", type: "flat", value: 50, minOrder: 100, maxDiscount: 50, expiry: "2020-01-01", active: true, description: "Expired demo coupon" }
    ]);
    Store.write(KEYS.users, [{ id: "u_demo", name: "Demo Shopper", email: DEMO_USER.email, phone: "9876543210", passwordHash: demoHash(DEMO_USER.password), createdAt: Date.now() }]);
    ["cart", "wishlist", "addresses", "orders", "searches", "recent"].forEach(k => Store.write(KEYS[k], []));
    Store.remove(KEYS.currentUser); Store.remove(KEYS.appliedCoupon);
    localStorage.setItem(KEYS.initialized, "1");
  },
  resetDemo() { Object.values(KEYS).forEach(k => Store.remove(k)); try { sessionStorage.removeItem("meesho_admin"); } catch (e) {} Store.seed(); },

  products() { return Store.arr(KEYS.products); },
  product(id) { return Store.products().find(p => p.id === Number(id)) || null; },
  saveProducts(list) { return Store.write(KEYS.products, list); },
  categories() { const c = Store.arr(KEYS.categories); return c.length ? c : DEFAULT_CATEGORIES; },
  coupons() { return Store.arr(KEYS.coupons); },

  /* cart lines: {id, qty, size, color}; a line is unique by id+size+color */
  cart() { return Store.arr(KEYS.cart).filter(i => i && i.id && i.qty > 0); },
  saveCart(c) { return Store.write(KEYS.cart, c); },
  addToCart(id, qty, size, color) {
    const p = Store.product(id); if (!p) return { ok: false, msg: "Product not found" };
    if (p.stock <= 0) return { ok: false, msg: "Out of stock" };
    const cart = Store.cart();
    size = size || (p.sizes && p.sizes[0]) || ""; color = color || (p.colors && p.colors[0]) || "";
    const inCart = cart.filter(i => i.id === p.id).reduce((s, i) => s + i.qty, 0);
    const want = Math.max(1, Math.floor(Number(qty) || 1));
    if (inCart + want > p.stock) return { ok: false, msg: "Only " + p.stock + " in stock" + (inCart ? " (" + inCart + " already in cart)" : "") };
    const line = cart.find(i => i.id === p.id && i.size === size && i.color === color);
    if (line) line.qty += want; else cart.push({ id: p.id, qty: want, size, color });
    Store.saveCart(cart); return { ok: true, msg: "Added to cart" };
  },
  cartCount() { return Store.cart().reduce((s, i) => s + i.qty, 0); },

  wishlist() { return Store.arr(KEYS.wishlist).map(Number); },
  toggleWish(id) {
    id = Number(id); let w = Store.wishlist(); const had = w.includes(id);
    w = had ? w.filter(x => x !== id) : w.concat(id); Store.write(KEYS.wishlist, w); return !had;
  },

  users() { return Store.arr(KEYS.users); },
  currentUser() { const id = Store.read(KEYS.currentUser, null); return id ? Store.users().find(u => u.id === id) || null : null; },
  addresses(userId) { return Store.arr(KEYS.addresses).filter(a => a.userId === userId); },
  orders(userId) { return Store.arr(KEYS.orders).filter(o => o.userId === userId); },

  addRecent(id) { const r = Store.arr(KEYS.recent).filter(x => x !== Number(id)); r.unshift(Number(id)); Store.write(KEYS.recent, r.slice(0, 10)); },
  addSearch(q) { q = (q || "").trim(); if (!q) return; const s = Store.arr(KEYS.searches).filter(x => x.toLowerCase() !== q.toLowerCase()); s.unshift(q); Store.write(KEYS.searches, s.slice(0, 8)); }
};
Store.init();
