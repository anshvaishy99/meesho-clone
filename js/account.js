/* account.js */
(function () {
  if (!Auth.require()) return;
  const root = document.getElementById("acc-root");
  function render() {
    const u = Auth.user(); if (!u) return;
    const addrs = Store.addresses(u.id), orders = Store.orders(u.id).sort((a, b) => b.createdAt - a.createdAt), wl = Store.wishlist().map(Store.product).filter(Boolean);
    root.innerHTML = '<div class="grid-2" style="gap:20px;align-items:start"><div class="panel"><h2>Profile</h2><div id="acc-msg" class="form-msg hidden"></div><form id="profile-form" novalidate>' +
      '<div class="field"><label for="p-name">Full name</label><input id="p-name" value="' + U.esc(u.name) + '"><small class="err" id="p-name-err"></small></div>' +
      '<div class="field"><label for="p-email">Email (cannot be changed)</label><input id="p-email" value="' + U.esc(u.email) + '" disabled></div>' +
      '<div class="field"><label for="p-phone">Phone</label><input id="p-phone" value="' + U.esc(u.phone) + '" maxlength="10"><small class="err" id="p-phone-err"></small></div>' +
      '<button class="btn" type="submit">Save changes</button> <button class="btn btn-outline" type="button" data-action="logout">Logout</button></form></div>' +
      '<div><div class="panel" style="margin-bottom:16px"><div class="section-head"><h2 style="margin:0">Saved addresses (' + addrs.length + ')</h2><a href="addresses.html">Manage →</a></div>' +
      (addrs.length ? addrs.slice(0, 2).map(a => '<p style="margin:6px 0"><b>' + U.esc(a.fullName) + '</b>' + (a.isDefault ? ' <span class="status Delivered">Default</span>' : "") + '<br><span class="muted">' + U.esc(a.house + ", " + a.locality + ", " + a.city + ", " + a.state + " - " + a.pin) + '</span></p>').join("") : '<p class="muted">No saved addresses yet.</p>') + '</div>' +
      '<div class="panel" style="margin-bottom:16px"><div class="section-head"><h2 style="margin:0">Recent orders (' + orders.length + ')</h2><a href="orders.html">View all →</a></div>' +
      (orders.length ? orders.slice(0, 3).map(o => '<p style="margin:6px 0"><a href="order-details.html?id=' + encodeURIComponent(o.id) + '"><b>' + U.esc(o.id) + '</b></a> · ' + U.money(o.total) + ' · <span class="status ' + U.esc(o.status) + '">' + U.esc(o.status) + '</span></p>').join("") : '<p class="muted">No orders yet.</p>') + '</div>' +
      '<div class="panel"><div class="section-head"><h2 style="margin:0">Wishlist (' + wl.length + ')</h2><a href="wishlist.html">View →</a></div>' +
      (wl.length ? '<p style="margin:0">' + wl.slice(0, 4).map(p => '<a href="product-details.html?id=' + p.id + '" style="display:block;padding:3px 0">' + U.esc(p.name) + '</a>').join("") + '</p>' : '<p class="muted">Nothing saved yet.</p>') + '</div></div></div>';
  }
  root.addEventListener("submit", e => {
    if (e.target.id !== "profile-form") return; e.preventDefault();
    const name = document.getElementById("p-name").value.trim(), phone = document.getElementById("p-phone").value.trim(); let bad = false;
    document.getElementById("p-name-err").textContent = name.length < 2 ? (bad = true, "Enter your name") : "";
    document.getElementById("p-phone-err").textContent = !V.phone(phone) ? (bad = true, "Enter a valid 10-digit mobile number") : "";
    if (bad) return;
    const users = Store.users(), me = Auth.user();
    if (users.some(x => x.id !== me.id && x.phone === phone)) { document.getElementById("p-phone-err").textContent = "This phone is used by another account"; return; }
    const i = users.findIndex(x => x.id === me.id); users[i].name = name; users[i].phone = phone; Store.write(KEYS.users, users);
    renderLayout(); updateBadges(); render(); const m = document.getElementById("acc-msg"); m.textContent = "Profile updated"; m.className = "form-msg success";
  });
  window.onDataChange = render; render();
})();
