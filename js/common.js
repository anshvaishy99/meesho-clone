/* common.js - shared helpers: formatting, calculations, layout, product cards, global actions. */
const INDIA_STATES = ["Andhra Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand","West Bengal"];
const DELIVERY_RULES = { freeAbove: 499, charge: 49 };           // configurable demo rule
const STATUS_FLOW = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const U = {
  esc(s) { return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
  money(n) { n = Number(n); if (!isFinite(n)) n = 0; return "₹" + Math.round(n).toLocaleString("en-IN"); },
  qs(name) { return new URLSearchParams(location.search).get(name); },
  $(sel, root) { return (root || document).querySelector(sel); },
  $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },
  stars(r) { const f = Math.round(r); return "★".repeat(f) + "☆".repeat(5 - f); },
  date(ts) { return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); },
  toast(msg, type) {
    let box = document.getElementById("toast-box");
    if (!box) { box = document.createElement("div"); box.id = "toast-box"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const t = document.createElement("div"); t.className = "toast " + (type || "success"); t.textContent = msg; box.appendChild(t);
    setTimeout(() => { t.classList.add("hide"); setTimeout(() => t.remove(), 300); }, 2600);
  },
  img(p, idx) {                         // product image with generated fallback
    if (p.image && !idx) return p.image;
    return U.placeholder(p, idx || 0);
  },
  placeholder(p, idx) {
    const cat = Store.categories().find(c => c.name === p.category), hue = ((cat ? cat.hue : 330) + (idx || 0) * 18) % 360;
    const label = ["Front view", "Side view", "Close-up", "Pack"][idx || 0] || "";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',80%,92%)"/><stop offset="1" stop-color="hsl(' + hue + ',70%,80%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="215" font-size="130" text-anchor="middle">' + (p.icon || "🛍️") + '</text><text x="200" y="350" font-size="22" text-anchor="middle" fill="hsl(' + hue + ',40%,30%)" font-family="Arial">' + label + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  },
  imgFallback() { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3e5ee"/><text x="200" y="220" font-size="110" text-anchor="middle">🛍️</text></svg>'); },
  debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
};

/* ---------- Calculations (always derived from product data + cart quantities) ---------- */
const Calc = {
  discountPct(original, price) { return original > 0 && price < original ? Math.round((original - price) / original * 100) : 0; },
  lines(cart) {                          // resolve cart -> lines with live product data, clamp to stock
    return (cart || Store.cart()).map(i => {
      const p = Store.product(i.id); if (!p) return null;
      const qty = Math.max(0, Math.min(Math.floor(Number(i.qty) || 0), p.stock));
      return { product: p, qty, requested: i.qty, size: i.size || "", color: i.color || "", outOfStock: p.stock <= 0, clamped: qty < i.qty };
    }).filter(l => l && l.qty > 0);
  },
  coupon(code, subtotal) {               // -> {ok, msg, discount, freeShip, coupon}
    code = String(code || "").trim().toUpperCase();
    const c = Store.coupons().find(x => x.code.toUpperCase() === code);
    if (!c) return { ok: false, msg: "Invalid coupon code" };
    if (!c.active) return { ok: false, msg: "This coupon is not active" };
    if (c.expiry && new Date(c.expiry + "T23:59:59") < new Date()) return { ok: false, msg: "This coupon has expired" };
    if (subtotal < Number(c.minOrder || 0)) return { ok: false, msg: "Add items worth " + U.money(c.minOrder - subtotal) + " more to use " + c.code };
    let d = 0, free = false;
    if (c.type === "percent") { d = subtotal * c.value / 100; if (c.maxDiscount > 0) d = Math.min(d, c.maxDiscount); }
    else if (c.type === "flat") d = Math.min(c.value, subtotal);
    else if (c.type === "freeship") free = true;
    return { ok: true, msg: c.code + " applied", discount: Math.max(0, Math.min(Math.round(d), subtotal)), freeShip: free, coupon: c };
  },
  totals(lines, couponCode) {
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const mrp = lines.reduce((s, l) => s + Math.max(l.product.originalPrice, l.product.price) * l.qty, 0);
    const productDiscount = Math.max(0, mrp - subtotal);
    let couponDiscount = 0, freeShip = false, couponMsg = "", couponOk = false;
    if (couponCode && lines.length) { const r = Calc.coupon(couponCode, subtotal); couponOk = r.ok; couponMsg = r.msg; if (r.ok) { couponDiscount = r.discount; freeShip = r.freeShip; } }
    const afterDiscount = Math.max(0, subtotal - couponDiscount);
    const delivery = !lines.length ? 0 : (freeShip || afterDiscount >= DELIVERY_RULES.freeAbove ? 0 : DELIVERY_RULES.charge);
    return { subtotal, mrp, productDiscount, couponDiscount, couponOk, couponMsg, delivery, total: Math.max(0, afterDiscount + delivery), items: lines.reduce((s, l) => s + l.qty, 0) };
  },
  appliedCoupon() { return Store.read(KEYS.appliedCoupon, "") || ""; }
};

/* ---------- Validation ---------- */
const V = {
  email: s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s),
  phone: s => /^[6-9]\d{9}$/.test(s),
  pin: s => /^[1-9]\d{5}$/.test(s),
  strength(pw) { let s = 0; if (pw.length >= 8) s++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s; },
  address(a) {
    const e = {};
    if (!a.fullName || a.fullName.trim().length < 2) e.fullName = "Enter the full name";
    if (!V.phone(a.phone)) e.phone = "Enter a valid 10-digit mobile number";
    if (!a.house || a.house.trim().length < 3) e.house = "Enter house no. and street";
    if (!a.locality || a.locality.trim().length < 2) e.locality = "Enter the locality";
    if (!a.city || a.city.trim().length < 2) e.city = "Enter the city";
    if (!a.state) e.state = "Select a state";
    if (!V.pin(a.pin)) e.pin = "Enter a valid 6-digit PIN code";
    return e;
  },
  deliveryCheck(pin) {                   // configurable demo rules
    if (!V.pin(pin)) return { ok: false, msg: "Enter a valid 6-digit PIN code" };
    if (pin.endsWith("000")) return { ok: false, msg: "Sorry, delivery is not available at " + pin + " (demo rule)" };
    const days = 3 + (Number(pin[0]) % 5);
    return { ok: true, msg: "Delivery available. Estimated in " + days + "-" + (days + 2) + " days" };
  }
};
const Addr = {
  formHtml(p) {
    const f = (id, label, attrs) => '<div class="field"><label for="' + p + id + '">' + label + '</label><input id="' + p + id + '" ' + (attrs || "") + '><small class="err" id="' + p + id + '-err"></small></div>';
    return '<div class="grid-2">' + f("fullName", "Full name", 'autocomplete="name"') + f("phone", "Mobile number", 'inputmode="numeric" maxlength="10" autocomplete="tel"') + '</div>' +
      f("house", "House no. and street", 'autocomplete="address-line1"') + f("locality", "Locality / area", "") +
      '<div class="grid-3">' + f("city", "City", "") +
      '<div class="field"><label for="' + p + 'state">State</label><select id="' + p + 'state"><option value="">Select state</option>' + INDIA_STATES.map(s => "<option>" + s + "</option>").join("") + '</select><small class="err" id="' + p + 'state-err"></small></div>' +
      f("pin", "PIN code", 'inputmode="numeric" maxlength="6"') + '</div>';
  },
  read(p) { const g = id => document.getElementById(p + id).value.trim(); return { fullName: g("fullName"), phone: g("phone"), house: g("house"), locality: g("locality"), city: g("city"), state: g("state"), pin: g("pin") }; },
  fill(p, a) { Object.keys(a || {}).forEach(k => { const el = document.getElementById(p + k); if (el) el.value = a[k]; }); },
  showErrors(p, errs) { ["fullName", "phone", "house", "locality", "city", "state", "pin"].forEach(k => { const el = document.getElementById(p + k + "-err"); if (el) el.textContent = errs[k] || ""; }); }
};

/* ---------- Auth helpers ---------- */
const Auth = {
  user() { return Store.currentUser(); },
  require() { if (!Auth.user()) { location.replace("login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search)); return false; } return true; },
  logout() { Store.remove(KEYS.currentUser); U.toast("Logged out"); setTimeout(() => location.href = "index.html", 500); }
};

/* ---------- Product card ---------- */
function productCard(p) {
  const wished = Store.wishlist().includes(p.id), out = p.stock <= 0;
  return '<article class="card product-card">' +
    '<button class="wish-btn' + (wished ? " active" : "") + '" data-action="wish" data-id="' + p.id + '" aria-label="Toggle wishlist" aria-pressed="' + wished + '">' + (wished ? "♥" : "♡") + '</button>' +
    '<a href="product-details.html?id=' + p.id + '" class="card-img"><img loading="lazy" src="' + U.img(p) + '" alt="' + U.esc(p.name) + '" data-fallback>' +
    (p.isNew ? '<span class="tag tag-new">NEW</span>' : "") + (out ? '<span class="tag tag-out">Sold out</span>' : "") + '</a>' +
    '<div class="card-body"><a href="product-details.html?id=' + p.id + '" class="card-title" title="' + U.esc(p.name) + '">' + U.esc(p.name) + '</a>' +
    '<div class="price-row"><span class="price">' + U.money(p.price) + '</span><span class="mrp">' + U.money(p.originalPrice) + '</span><span class="off">' + Calc.discountPct(p.originalPrice, p.price) + '% off</span></div>' +
    '<div class="meta"><span class="rating">' + p.rating.toFixed(1) + ' ★</span><span class="muted">' + p.reviews.toLocaleString("en-IN") + ' reviews</span></div>' +
    '<span class="free-del">Free Delivery</span>' +
    '<button class="btn btn-outline btn-sm btn-block" data-action="add-cart" data-id="' + p.id + '"' + (out ? " disabled" : "") + '>' + (out ? "Out of stock" : "Add to Cart") + '</button></div></article>';
}
function renderProducts(el, list, emptyMsg) {
  if (!el) return;
  el.innerHTML = list.length ? list.map(productCard).join("") : '<div class="empty-state"><div class="empty-icon">🛍️</div><p>' + U.esc(emptyMsg || "No products found") + '</p></div>';
}

/* ---------- Layout (header + footer injected on every page) ---------- */
function renderLayout() {
  const user = Auth.user(), cats = Store.categories();
  const header = document.getElementById("site-header");
  if (header) header.innerHTML =
    '<div class="topbar">🎉 Demo store — no real payments. Use code <b>WELCOME10</b> for 10% off!</div>' +
    '<div class="header-main container"><button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false">☰</button>' +
    '<a href="index.html" class="logo" aria-label="Meesho clone home">meesho<span>.</span></a>' +
    '<form class="search-form" id="header-search" action="search.html" role="search"><input type="search" name="q" id="header-q" placeholder="Search for sarees, kurtis, shoes…" aria-label="Search products" autocomplete="off"><button type="submit" aria-label="Search">🔍</button></form>' +
    '<nav class="header-actions" aria-label="Account">' +
    (user ? '<a href="account.html" class="hdr-link"><span class="hdr-ico">👤</span><span class="hdr-txt">' + U.esc(user.name.split(" ")[0]) + '</span></a>' : '<a href="login.html" class="hdr-link"><span class="hdr-ico">👤</span><span class="hdr-txt">Login</span></a>') +
    '<a href="wishlist.html" class="hdr-link"><span class="hdr-ico">♡<i class="badge" data-badge="wishlist">0</i></span><span class="hdr-txt">Wishlist</span></a>' +
    '<a href="cart.html" class="hdr-link"><span class="hdr-ico">🛒<i class="badge" data-badge="cart">0</i></span><span class="hdr-txt">Cart</span></a></nav></div>' +
    '<nav class="cat-nav" id="cat-nav" aria-label="Categories"><div class="container cat-nav-inner"><a href="products.html">All</a>' +
    cats.map(c => '<a href="products.html?cat=' + encodeURIComponent(c.name) + '">' + U.esc(c.name) + '</a>').join("") +
    '<a href="orders.html">My Orders</a>' + (user ? '<a href="#" data-action="logout">Logout</a>' : '<a href="register.html">Sign up</a>') + '</div></nav>';
  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML =
    '<div class="container footer-grid"><div><h4>meesho<span style="color:var(--pink)">.</span> clone</h4><p>A frontend-only demo shop built with HTML, CSS and vanilla JavaScript. Not affiliated with Meesho. Checkout and payments are simulated.</p></div>' +
    '<div><h4>Shop</h4><a href="products.html">All products</a><a href="search.html">Search</a><a href="wishlist.html">Wishlist</a><a href="cart.html">Cart</a></div>' +
    '<div><h4>Account</h4><a href="login.html">Login</a><a href="register.html">Register</a><a href="orders.html">Orders</a><a href="addresses.html">Addresses</a></div>' +
    '<div><h4>Demo tools</h4><a href="admin.html">Admin panel</a><a href="#" data-action="reset-demo">Reset demo data</a></div></div>' +
    '<div class="footer-bottom">© 2026 Demo project · Educational use only</div>';
  const q = U.qs("q"), hq = document.getElementById("header-q"); if (hq && q && /search\.html$/.test(location.pathname)) hq.value = q;
}
function updateBadges() {
  const vals = { cart: Store.cartCount(), wishlist: Store.wishlist().length };
  U.$$("[data-badge]").forEach(b => { const n = vals[b.dataset.badge] || 0; b.textContent = n > 99 ? "99+" : n; b.style.display = n ? "" : "none"; });
}
function refreshPage() { updateBadges(); if (typeof window.onDataChange === "function") window.onDataChange(); }

/* ---------- Global delegated actions (registered ONCE) ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-action]"); if (t) {
    const a = t.dataset.action, id = t.dataset.id;
    if (a === "wish") {
      e.preventDefault(); const now = Store.toggleWish(id);
      U.$$('[data-action="wish"][data-id="' + id + '"]').forEach(b => { b.classList.toggle("active", now); b.textContent = b.classList.contains("wish-text") ? (now ? "♥ Wishlisted" : "♡ Add to Wishlist") : (now ? "♥" : "♡"); b.setAttribute("aria-pressed", now); });
      U.toast(now ? "Added to wishlist" : "Removed from wishlist", now ? "success" : "info"); refreshPage();
    } else if (a === "add-cart") {
      e.preventDefault(); const r = Store.addToCart(id, 1); U.toast(r.msg, r.ok ? "success" : "error"); refreshPage();
    } else if (a === "logout") { e.preventDefault(); Auth.logout(); }
    else if (a === "reset-demo") { e.preventDefault(); if (confirm("Reset ALL demo data (products, users, orders, cart…)? This cannot be undone.")) { Store.resetDemo(); U.toast("Demo data reset"); setTimeout(() => location.href = "index.html", 600); } }
  }
  if (e.target.closest("#menu-toggle")) { const nav = document.getElementById("cat-nav"), open = nav.classList.toggle("open"); e.target.closest("#menu-toggle").setAttribute("aria-expanded", open); }
});
/* image error fallback (error events don't bubble, so use capture) */
document.addEventListener("error", e => { const i = e.target; if (i && i.tagName === "IMG" && !i.dataset.failed) { i.dataset.failed = "1"; i.src = U.imgFallback(); } }, true);
/* keep tabs in sync */
window.addEventListener("storage", e => { if (!e.key || e.key.indexOf("meesho_") === 0) refreshPage(); });
document.addEventListener("DOMContentLoaded", () => { renderLayout(); updateBadges(); });

/* ---------- Order operations shared by orders page and admin ---------- */
const OrderOps = {
  all() { return Store.arr(KEYS.orders); },
  save(list) { return Store.write(KEYS.orders, list); },
  canCancel(o) { return o.status === "Placed" || o.status === "Confirmed"; },
  cancel(id) {
    const list = OrderOps.all(), o = list.find(x => x.id === id);
    if (!o || o.status === "Cancelled" || o.status === "Delivered") return false;
    const prods = Store.products();
    o.items.forEach(it => { const p = prods.find(x => x.id === it.id); if (p) p.stock += it.qty; });   // restore stock
    Store.saveProducts(prods); o.status = "Cancelled"; (o.history = o.history || []).push({ status: "Cancelled", at: Date.now() });
    OrderOps.save(list); return true;
  },
  setStatus(id, status) {
    if (status === "Cancelled") return OrderOps.cancel(id);
    const list = OrderOps.all(), o = list.find(x => x.id === id);
    if (!o || o.status === "Cancelled" || !STATUS_FLOW.includes(status)) return false;
    o.status = status; (o.history = o.history || []).push({ status, at: Date.now() }); OrderOps.save(list); return true;
  },
  newId() {
    const d = new Date(), ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"), ex = OrderOps.all().map(o => o.id);
    let id; do { id = "ORD" + ymd + "-" + Math.random().toString(36).slice(2, 7).toUpperCase(); } while (ex.includes(id)); return id;
  },
  itemImg(it) { return U.img({ name: it.name, icon: it.icon, category: it.category, image: it.image }, 0); }
};
