/* orders.js */
(function () {
  if (!Auth.require()) return;
  const root = document.getElementById("orders-root");
  function render() {
    const me = Auth.user(); if (!me) return; const orders = Store.orders(me.id).sort((a, b) => b.createdAt - a.createdAt);
    if (!orders.length) { root.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h2>No orders yet</h2><p>When you place an order it will appear here.</p><a class="btn" href="products.html">Start shopping</a></div>'; return; }
    root.innerHTML = orders.map(o => '<div class="panel order-card"><div class="order-head"><div><b>' + U.esc(o.id) + '</b><br><span class="muted">Placed ' + U.date(o.createdAt) + '</span></div><div><span class="muted">Total</span><br><b>' + U.money(o.total) + '</b></div><div><span class="muted">Payment</span><br>' + U.esc(o.payment) + '</div><div><span class="status ' + U.esc(o.status) + '">' + U.esc(o.status) + '</span></div></div>' +
      o.items.map(it => '<div class="o-item"><img src="' + OrderOps.itemImg(it) + '" alt="" data-fallback><div style="flex:1">' + U.esc(it.name) + '<div class="muted" style="font-size:.8rem">Qty ' + it.qty + ' × ' + U.money(it.price) + '</div></div></div>').join("") +
      '<div class="row-actions" style="margin-top:10px"><a class="btn btn-sm" href="order-details.html?id=' + encodeURIComponent(o.id) + '">View details</a><button class="btn btn-outline btn-sm" data-act="reorder" data-id="' + U.esc(o.id) + '" type="button">Reorder</button>' +
      (OrderOps.canCancel(o) ? '<button class="btn btn-outline btn-sm" data-act="cancel" data-id="' + U.esc(o.id) + '" type="button">Cancel order</button>' : "") + '</div></div>').join("");
  }
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return; const me = Auth.user(), o = Store.orders(me.id).find(x => x.id === b.dataset.id); if (!o) return;
    if (b.dataset.act === "cancel") { if (confirm("Cancel order " + o.id + "?") && OrderOps.cancel(o.id)) { U.toast("Order cancelled"); render(); } }
    else { let ok = 0, miss = []; o.items.forEach(it => { const r = Store.addToCart(it.id, it.qty, it.size, it.color); if (r.ok) ok++; else miss.push(it.name + " (" + r.msg + ")"); });
      refreshPage(); if (miss.length) U.toast(miss.length + " item(s) could not be added: " + miss[0], "error"); if (ok) { U.toast(ok + " item(s) added to cart"); setTimeout(() => location.href = "cart.html", 900); } }
  });
  window.onDataChange = render; render();
})();
