/* addresses.js */
(function () {
  if (!Auth.require()) return;
  const P = "a-", list = document.getElementById("addr-list"), form = document.getElementById("addr-form");
  let editId = null;
  document.getElementById("addr-fields").innerHTML = Addr.formHtml(P);
  function all() { return Store.arr(KEYS.addresses); }
  function render() {
    const me = Auth.user(), mine = Store.addresses(me.id);
    list.innerHTML = mine.length ? mine.map(a => '<div class="panel addr-card"><b>' + U.esc(a.fullName) + '</b>' + (a.isDefault ? '<span class="default-tag">Default</span>' : "") +
      '<p class="muted" style="margin:6px 0">' + U.esc(a.house) + ", " + U.esc(a.locality) + "<br>" + U.esc(a.city) + ", " + U.esc(a.state) + " - " + U.esc(a.pin) + "<br>📞 " + U.esc(a.phone) + '</p>' +
      '<div class="row-actions"><button class="btn btn-outline btn-sm" data-a="edit" data-id="' + a.id + '" type="button">Edit</button><button class="btn btn-outline btn-sm" data-a="del" data-id="' + a.id + '" type="button">Delete</button>' +
      (a.isDefault ? "" : '<button class="btn btn-sm" data-a="def" data-id="' + a.id + '" type="button">Set default</button>') + '</div></div>').join("")
      : '<div class="empty-state">No saved addresses yet. Add one below.</div>';
  }
  function resetForm() { editId = null; form.reset(); Addr.showErrors(P, {}); document.getElementById("addr-form-title").textContent = "Add new address"; document.getElementById("addr-submit").textContent = "Save address"; document.getElementById("addr-cancel").classList.add("hidden"); }
  list.addEventListener("click", e => {
    const b = e.target.closest("[data-a]"); if (!b) return; const me = Auth.user(), id = b.dataset.id; let a = all();
    if (b.dataset.a === "del") { if (!confirm("Delete this address?")) return; const was = a.find(x => x.id === id); a = a.filter(x => x.id !== id);
      if (was && was.isDefault) { const f = a.find(x => x.userId === me.id); if (f) f.isDefault = true; } Store.write(KEYS.addresses, a); if (editId === id) resetForm(); U.toast("Address deleted"); }
    else if (b.dataset.a === "def") { a.forEach(x => { if (x.userId === me.id) x.isDefault = x.id === id; }); Store.write(KEYS.addresses, a); U.toast("Default address updated"); }
    else { const x = a.find(y => y.id === id); if (!x) return; editId = id; Addr.fill(P, x); document.getElementById("addr-default").checked = !!x.isDefault; document.getElementById("addr-form-title").textContent = "Edit address"; document.getElementById("addr-submit").textContent = "Update address"; document.getElementById("addr-cancel").classList.remove("hidden"); form.scrollIntoView({ behavior: "smooth" }); }
    render();
  });
  document.getElementById("addr-cancel").addEventListener("click", resetForm);
  form.addEventListener("submit", e => {
    e.preventDefault(); const d = Addr.read(P), errs = V.address(d); Addr.showErrors(P, errs); if (Object.keys(errs).length) return;
    const me = Auth.user(); let a = all(), wantDefault = document.getElementById("addr-default").checked;
    const mineCount = a.filter(x => x.userId === me.id).length;
    if (editId) { const x = a.find(y => y.id === editId); if (!x) { resetForm(); return; } Object.assign(x, d); if (wantDefault) a.forEach(y => { if (y.userId === me.id) y.isDefault = y.id === editId; }); U.toast("Address updated"); }
    else { if (!mineCount) wantDefault = true; if (wantDefault) a.forEach(y => { if (y.userId === me.id) y.isDefault = false; });
      a.push(Object.assign({ id: "addr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), userId: me.id, isDefault: wantDefault }, d)); U.toast("Address saved"); }
    Store.write(KEYS.addresses, a); resetForm(); render();
  });
  window.onDataChange = render; render();
})();
