/* order-details.js - only shows orders of the current user */
(function () {
  if (!Auth.require()) return;
  const root = document.getElementById("od-root"), id = U.qs("id"), me = Auth.user();
  const o = id ? Store.orders(me.id).find(x => x.id === id) : null;
  if (!o) { root.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h2>Order not found</h2><p>This order does not exist or does not belong to your account.</p><a class="btn" href="orders.html">Back to orders</a></div>'; return; }
  const hist = {}; (o.history || []).forEach(h => { hist[h.status] = h.at; });
  const cancelled = o.status === "Cancelled", idx = STATUS_FLOW.indexOf(o.status);
  const steps = cancelled ? STATUS_FLOW.filter(s => hist[s]).concat("Cancelled") : STATUS_FLOW;
  root.innerHTML = '<h1 class="page-title">Order ' + U.esc(o.id) + '</h1><div class="notice">Demo order — simulated checkout and payment.</div><div class="cart-layout"><div>' +
    '<div class="panel" style="margin-bottom:16px"><div class="section-head"><h2 style="margin:0">Items</h2><span class="status ' + U.esc(o.status) + '">' + U.esc(o.status) + '</span></div>' +
    o.items.map(it => '<div class="o-item"><img src="' + OrderOps.itemImg(it) + '" alt="" data-fallback><div style="flex:1"><a href="product-details.html?id=' + it.id + '"><b>' + U.esc(it.name) + '</b></a><div class="muted" style="font-size:.8rem">Qty ' + it.qty + (it.size && it.size !== "Free Size" ? " · " + U.esc(it.size) : "") + (it.color ? " · " + U.esc(it.color) : "") + '</div></div><b>' + U.money(it.price * it.qty) + '</b></div>').join("") + '</div>' +
    '<div class="panel"><h2>Order tracking</h2><ul class="timeline">' + steps.map((s, i) => { const done = cancelled ? true : i <= idx; return '<li class="' + (done ? "done" : "") + (s === "Cancelled" ? " cancelled" : "") + '"><b>' + s + '</b>' + (hist[s] ? '<br><small>' + U.date(hist[s]) + '</small>' : "") + '</li>'; }).join("") + '</ul></div></div>' +
    '<aside><div class="panel" style="margin-bottom:16px"><h3>Delivery address</h3><p style="margin:0"><b>' + U.esc(o.address.fullName) + '</b><br>' + U.esc(o.address.house) + ', ' + U.esc(o.address.locality) + '<br>' + U.esc(o.address.city) + ', ' + U.esc(o.address.state) + ' - ' + U.esc(o.address.pin) + '<br>📞 ' + U.esc(o.address.phone) + '</p></div>' +
    '<div class="panel"><h3>Payment summary</h3><div class="sum-row"><span>Placed on</span><span>' + U.date(o.createdAt) + '</span></div><div class="sum-row"><span>Payment</span><span>' + U.esc(o.payment) + '</span></div><div class="sum-row"><span>Subtotal</span><span>' + U.money(o.subtotal) + '</span></div>' +
    (o.couponDiscount ? '<div class="sum-row save"><span>Coupon ' + U.esc(o.coupon) + '</span><span>− ' + U.money(o.couponDiscount) + '</span></div>' : "") + '<div class="sum-row"><span>Delivery</span><span>' + (o.delivery ? U.money(o.delivery) : "FREE") + '</span></div><div class="sum-row total"><span>Total</span><span>' + U.money(o.total) + '</span></div>' +
    (OrderOps.canCancel(o) ? '<button class="btn btn-outline btn-block" id="cancel-btn" type="button" style="margin-top:12px">Cancel order</button>' : "") + '<a class="btn btn-outline btn-block" href="orders.html" style="margin-top:10px">Back to orders</a></div></aside></div>';
  const cb = document.getElementById("cancel-btn");
  if (cb) cb.addEventListener("click", () => { if (confirm("Cancel this order?") && OrderOps.cancel(o.id)) { U.toast("Order cancelled"); setTimeout(() => location.reload(), 700); } });
})();
