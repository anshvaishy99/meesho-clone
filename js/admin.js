/* admin.js - DEMO admin panel. Frontend-only login is NOT secure. */
(function () {
  const root = document.getElementById("admin-root");
  const isAdmin = () => sessionStorage.getItem("meesho_admin") === "1";
  let tab = "dashboard", editing = null;
  const TABS = [["dashboard", "Dashboard"], ["products", "Products"], ["categories", "Categories"], ["orders", "Orders"], ["coupons", "Coupons"]];

  function loginView() {
    root.innerHTML = '<div class="narrow panel"><h2>Admin login</h2><div class="notice">Demo credentials: <code>admin</code> / <code>Admin@123</code></div><div id="al-msg" class="form-msg error hidden"></div><form id="admin-login" novalidate><div class="field"><label for="au">Username</label><input id="au" autocomplete="username"></div><div class="field"><label for="ap">Password</label><input id="ap" type="password" autocomplete="current-password"></div><button class="btn btn-block" type="submit">Login</button></form></div>';
  }
  function csv(s) { return String(s || "").split(",").map(x => x.trim()).filter(Boolean); }
  function view() {
    if (!isAdmin()) return loginView();
    root.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div class="tabs" style="flex:1">' + TABS.map(t => '<button class="tab' + (t[0] === tab ? " active" : "") + '" data-tab="' + t[0] + '" type="button">' + t[1] + '</button>').join("") + '</div><button class="btn btn-outline btn-sm" id="admin-logout" type="button">Admin logout</button></div><div id="tab-body"></div>';
    const b = document.getElementById("tab-body"); ({ dashboard, products, categories, orders, coupons })[tab](b);
  }
  function dashboard(b) {
    const ps = Store.products(), os = OrderOps.all(), valid = os.filter(o => o.status !== "Cancelled"), rev = valid.reduce((s, o) => s + o.total, 0), low = ps.filter(p => p.stock <= 10);
    b.innerHTML = '<div class="stats"><div class="stat"><b>' + ps.length + '</b>Products</div><div class="stat"><b>' + os.length + '</b>Orders</div><div class="stat"><b>' + U.money(rev) + '</b>Revenue (excl. cancelled)</div><div class="stat"><b>' + Store.users().length + '</b>Users</div><div class="stat"><b>' + low.length + '</b>Low stock (≤10)</div><div class="stat"><b>' + Store.coupons().filter(c => c.active).length + '</b>Active coupons</div></div>' +
      '<div class="panel"><h3>Low stock products</h3>' + (low.length ? '<ul>' + low.map(p => '<li>' + U.esc(p.name) + ' — <b>' + p.stock + '</b> left</li>').join("") + '</ul>' : '<p class="muted">All products are well stocked.</p>') + '</div>' +
      '<div class="panel" style="margin-top:16px"><h3>Demo data</h3><button class="btn btn-danger btn-sm" data-action="reset-demo" type="button">Reset all demo data</button></div>';
  }
  function products(b) {
    const ps = Store.products().sort((a, c) => a.id - c.id), e = editing ? ps.find(p => p.id === editing) : null, v = e || { name: "", category: Store.categories()[0].name, price: "", originalPrice: "", stock: "", sizes: [], colors: [], keywords: [], image: "", description: "", featured: false, isNew: false };
    b.innerHTML = '<div class="panel admin-form"><h3>' + (e ? "Edit product #" + e.id : "Add product") + '</h3><div id="pf-msg" class="form-msg error hidden"></div><form id="prod-form" novalidate><div class="grid-2"><div class="field"><label for="pf-name">Name</label><input id="pf-name" value="' + U.esc(v.name) + '"></div><div class="field"><label for="pf-cat">Category</label><select id="pf-cat">' + Store.categories().map(c => '<option' + (c.name === v.category ? " selected" : "") + '>' + U.esc(c.name) + '</option>').join("") + '</select></div></div>' +
      '<div class="grid-3"><div class="field"><label for="pf-price">Price (₹)</label><input id="pf-price" type="number" min="1" value="' + U.esc(v.price) + '"></div><div class="field"><label for="pf-orig">Original price (₹)</label><input id="pf-orig" type="number" min="1" value="' + U.esc(v.originalPrice) + '"></div><div class="field"><label for="pf-stock">Stock</label><input id="pf-stock" type="number" min="0" value="' + U.esc(v.stock) + '"></div></div>' +
      '<div class="grid-3"><div class="field"><label for="pf-sizes">Sizes (comma separated)</label><input id="pf-sizes" value="' + U.esc((v.sizes || []).join(", ")) + '"></div><div class="field"><label for="pf-colors">Colors</label><input id="pf-colors" value="' + U.esc((v.colors || []).join(", ")) + '"></div><div class="field"><label for="pf-kw">Keywords</label><input id="pf-kw" value="' + U.esc((v.keywords || []).join(", ")) + '"></div></div>' +
      '<div class="field"><label for="pf-img">Image URL (optional — a placeholder is used if empty or broken)</label><input id="pf-img" value="' + U.esc(v.image) + '"></div><div class="field"><label for="pf-desc">Description</label><textarea id="pf-desc" rows="2">' + U.esc(v.description) + '</textarea></div>' +
      '<label class="opt"><input type="checkbox" id="pf-feat"' + (v.featured ? " checked" : "") + '> Featured</label><label class="opt"><input type="checkbox" id="pf-new"' + (v.isNew ? " checked" : "") + '> New arrival</label>' +
      '<div style="margin-top:12px;display:flex;gap:10px"><button class="btn" type="submit">' + (e ? "Update product" : "Add product") + '</button>' + (e ? '<button class="btn btn-outline" type="button" id="pf-cancel">Cancel</button>' : "") + '</div></form></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>' +
      ps.map(p => '<tr><td><img src="' + U.img(p) + '" alt="" data-fallback></td><td>' + p.id + '</td><td>' + U.esc(p.name) + '</td><td>' + U.esc(p.category) + '</td><td><input type="number" min="1" value="' + p.price + '" data-q="price" data-id="' + p.id + '" aria-label="Price"></td><td><input type="number" min="0" value="' + p.stock + '" data-q="stock" data-id="' + p.id + '" aria-label="Stock"></td><td><div class="row-actions"><button class="btn btn-outline btn-sm" data-edit="' + p.id + '" type="button">Edit</button><button class="btn btn-danger btn-sm" data-del="' + p.id + '" type="button">Delete</button></div></td></tr>').join("") + '</tbody></table></div><p class="muted" style="font-size:.8rem">Edit price or stock inline — changes save when you leave the field.</p>';
  }
  function categories(b) {
    const cats = Store.categories(), ps = Store.products();
    b.innerHTML = '<div class="panel admin-form"><h3>Add category</h3><div id="cf-msg" class="form-msg error hidden"></div><form id="cat-form" class="grid-2" novalidate><div class="field"><label for="cf-name">Name</label><input id="cf-name"></div><div class="field"><label for="cf-icon">Emoji icon</label><input id="cf-icon" value="🛍️" maxlength="4"></div><div><button class="btn" type="submit">Add category</button></div></form></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Icon</th><th>Name</th><th>Products</th><th>Action</th></tr></thead><tbody>' + cats.map(c => { const n = ps.filter(p => p.category === c.name).length; return '<tr><td>' + U.esc(c.icon) + '</td><td>' + U.esc(c.name) + '</td><td>' + n + '</td><td><button class="btn btn-danger btn-sm" data-delcat="' + U.esc(c.name) + '" type="button"' + (n ? " disabled title=\"Remove or move its products first\"" : "") + '>Delete</button></td></tr>'; }).join("") + '</tbody></table></div>';
  }
  function orders(b) {
    const os = OrderOps.all().sort((a, c) => c.createdAt - a.createdAt), users = Store.users();
    b.innerHTML = os.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>' + os.map(o => { const u = users.find(x => x.id === o.userId); const locked = o.status === "Cancelled";
      return '<tr><td>' + U.esc(o.id) + '</td><td>' + U.esc(u ? u.name : "Unknown") + '</td><td>' + U.date(o.createdAt) + '</td><td>' + o.items.reduce((s, i) => s + i.qty, 0) + '</td><td>' + U.money(o.total) + '</td><td><select class="inline-select" data-ostatus="' + U.esc(o.id) + '"' + (locked ? " disabled" : "") + '>' + STATUS_FLOW.concat("Cancelled").map(s => '<option' + (s === o.status ? " selected" : "") + '>' + s + '</option>').join("") + '</select></td></tr>'; }).join("") + '</tbody></table></div>' : '<div class="empty-state">No orders yet. Place one from the shop first.</div>';
  }
  function coupons(b) {
    const cs = Store.coupons();
    b.innerHTML = '<div class="panel admin-form"><h3>Add coupon</h3><div id="co-msg" class="form-msg error hidden"></div><form id="coupon-form" novalidate><div class="grid-3"><div class="field"><label for="cp-code">Code</label><input id="cp-code" style="text-transform:uppercase"></div><div class="field"><label for="cp-type">Type</label><select id="cp-type"><option value="percent">Percent off</option><option value="flat">Flat amount off</option><option value="freeship">Free delivery</option></select></div><div class="field"><label for="cp-val">Value</label><input id="cp-val" type="number" min="0"></div></div><div class="grid-3"><div class="field"><label for="cp-min">Min order (₹)</label><input id="cp-min" type="number" min="0" value="0"></div><div class="field"><label for="cp-max">Max discount (₹)</label><input id="cp-max" type="number" min="0" value="0"></div><div class="field"><label for="cp-exp">Expiry date</label><input id="cp-exp" type="date"></div></div><button class="btn" type="submit">Add coupon</button></form></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Max</th><th>Expiry</th><th>Active</th><th></th></tr></thead><tbody>' + cs.map(c => '<tr><td><b>' + U.esc(c.code) + '</b></td><td>' + U.esc(c.type) + '</td><td>' + U.esc(c.value) + '</td><td>' + U.esc(c.minOrder) + '</td><td>' + U.esc(c.maxDiscount) + '</td><td>' + U.esc(c.expiry) + '</td><td><input type="checkbox" data-ctoggle="' + U.esc(c.code) + '"' + (c.active ? " checked" : "") + ' aria-label="Active"></td><td><button class="btn btn-danger btn-sm" data-cdel="' + U.esc(c.code) + '" type="button">Delete</button></td></tr>').join("") + '</tbody></table></div>';
  }
  const msg = (id, t) => { const m = document.getElementById(id); m.textContent = t; m.classList.remove("hidden"); };

  root.addEventListener("submit", e => {
    e.preventDefault(); const f = e.target.id;
    if (f === "admin-login") {
      const u = document.getElementById("au").value.trim(), p = document.getElementById("ap").value;
      if (u === DEMO_ADMIN.username && p === DEMO_ADMIN.password) { sessionStorage.setItem("meesho_admin", "1"); view(); } else { const m = document.getElementById("al-msg"); m.textContent = "Invalid admin credentials."; m.classList.remove("hidden"); }
    } else if (f === "prod-form") {
      const g = id => document.getElementById(id), name = g("pf-name").value.trim(), price = Number(g("pf-price").value), orig = Number(g("pf-orig").value), stock = Number(g("pf-stock").value);
      if (name.length < 2) return msg("pf-msg", "Enter a product name.");
      if (!(price > 0)) return msg("pf-msg", "Price must be greater than 0.");
      if (!(orig >= price)) return msg("pf-msg", "Original price must be at least the selling price.");
      if (!Number.isInteger(stock) || stock < 0) return msg("pf-msg", "Stock must be a whole number, 0 or more.");
      const list = Store.products(), sizes = csv(g("pf-sizes").value), data = { name, category: g("pf-cat").value, price, originalPrice: orig, discount: Calc.discountPct(orig, price), stock, sizes: sizes.length ? sizes : ["Free Size"], colors: csv(g("pf-colors").value), keywords: csv(g("pf-kw").value.toLowerCase()), image: g("pf-img").value.trim(), description: g("pf-desc").value.trim() || name, featured: g("pf-feat").checked, isNew: g("pf-new").checked };
      if (editing) Object.assign(list.find(p => p.id === editing), data);
      else list.push(Object.assign({ id: list.reduce((m, p) => Math.max(m, p.id), 100) + 1, rating: 4.0, reviews: 0, icon: (Store.categories().find(c => c.name === data.category) || {}).icon || "🛍️", createdAt: Date.now() }, data));
      Store.saveProducts(list); U.toast(editing ? "Product updated" : "Product added"); editing = null; view();
    } else if (f === "cat-form") {
      const name = document.getElementById("cf-name").value.trim(), icon = document.getElementById("cf-icon").value.trim() || "🛍️", cats = Store.categories();
      if (name.length < 2) return msg("cf-msg", "Enter a category name.");
      if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) return msg("cf-msg", "That category already exists.");
      cats.push({ name, icon, hue: Math.floor(Math.random() * 360) }); Store.write(KEYS.categories, cats); U.toast("Category added"); view();
    } else if (f === "coupon-form") {
      const g = id => document.getElementById(id).value.trim(), code = g("cp-code").toUpperCase().replace(/\s+/g, ""), type = g("cp-type"), val = Number(g("cp-val")), exp = g("cp-exp");
      if (!/^[A-Z0-9]{3,15}$/.test(code)) return msg("co-msg", "Code must be 3–15 letters/numbers.");
      if (Store.coupons().some(c => c.code === code)) return msg("co-msg", "That code already exists.");
      if (type !== "freeship" && !(val > 0)) return msg("co-msg", "Enter a value greater than 0.");
      if (type === "percent" && val > 100) return msg("co-msg", "Percent cannot exceed 100.");
      if (!exp) return msg("co-msg", "Choose an expiry date.");
      const cs = Store.coupons(); cs.push({ code, type, value: type === "freeship" ? 0 : val, minOrder: Number(g("cp-min")) || 0, maxDiscount: Number(g("cp-max")) || 0, expiry: exp, active: true, description: code + " — demo coupon" }); Store.write(KEYS.coupons, cs); U.toast("Coupon added"); view();
    }
  });
  root.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#admin-logout")) { sessionStorage.removeItem("meesho_admin"); view(); return; }
    const tb = t.closest("[data-tab]"); if (tb) { tab = tb.dataset.tab; editing = null; view(); return; }
    const ed = t.closest("[data-edit]"); if (ed) { editing = Number(ed.dataset.edit); view(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (t.closest("#pf-cancel")) { editing = null; view(); return; }
    const del = t.closest("[data-del]"); if (del) { if (!confirm("Delete this product? It will also be removed from carts and wishlists.")) return; const id = Number(del.dataset.del);
      Store.saveProducts(Store.products().filter(p => p.id !== id)); Store.saveCart(Store.cart().filter(i => i.id !== id)); Store.write(KEYS.wishlist, Store.wishlist().filter(x => x !== id)); U.toast("Product deleted"); refreshPage(); view(); return; }
    const dc = t.closest("[data-delcat]"); if (dc && !dc.disabled) { Store.write(KEYS.categories, Store.categories().filter(c => c.name !== dc.dataset.delcat)); U.toast("Category deleted"); renderLayout(); updateBadges(); view(); return; }
    const cd = t.closest("[data-cdel]"); if (cd) { if (confirm("Delete coupon " + cd.dataset.cdel + "?")) { Store.write(KEYS.coupons, Store.coupons().filter(c => c.code !== cd.dataset.cdel)); view(); } }
  });
  root.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.q) {                       // inline price / stock edit
      const list = Store.products(), p = list.find(x => x.id === Number(t.dataset.id)), v = Number(t.value);
      if (!p) return;
      if (t.dataset.q === "price") { if (!(v > 0)) { U.toast("Price must be above 0", "error"); t.value = p.price; return; } p.price = v; if (p.originalPrice < v) p.originalPrice = v; p.discount = Calc.discountPct(p.originalPrice, p.price); }
      else { if (!Number.isInteger(v) || v < 0) { U.toast("Stock must be a whole number ≥ 0", "error"); t.value = p.stock; return; } p.stock = v; }
      Store.saveProducts(list); U.toast("Saved"); refreshPage();
    }
    if (t.dataset.ostatus) { if (OrderOps.setStatus(t.dataset.ostatus, t.value)) U.toast("Order status updated"); else U.toast("Could not update status", "error"); view(); }
    if (t.dataset.ctoggle) { const cs = Store.coupons(), c = cs.find(x => x.code === t.dataset.ctoggle); if (c) { c.active = t.checked; Store.write(KEYS.coupons, cs); U.toast("Coupon " + (c.active ? "activated" : "deactivated")); } }
  });
  view();
})();
