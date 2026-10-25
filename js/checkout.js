/* checkout.js - SIMULATED checkout. No real payment. */
(function () {
  if (!Auth.require()) return;
  const root = document.getElementById("co-root"), P = "n-";
  const st = { addrId: null, adding: false, payment: "cod", placing: false, done: false };
  const PAY = [["cod", "Cash on Delivery (demo)"], ["upi", "UPI (demo — no real payment)"], ["card", "Card (demo — no card details collected)"]];

  function frame() {
    root.innerHTML = '<div class="cart-layout"><div>' +
      '<div class="panel" style="margin-bottom:16px"><h2 class="step-title"><b>1</b> Delivery address</h2><div id="co-addrs"></div></div>' +
      '<div class="panel" style="margin-bottom:16px"><h2 class="step-title"><b>2</b> Payment method <small class="muted">(simulated)</small></h2><div id="co-pay"></div></div>' +
      '<div class="panel"><h2 class="step-title"><b>3</b> Review items</h2><div id="co-items"></div></div></div>' +
      '<aside class="panel summary"><h3>Order summary</h3><div class="coupon-row"><input class="input" id="co-coupon" placeholder="Coupon code" aria-label="Coupon code"><button class="btn btn-dark btn-sm" id="co-apply" type="button">Apply</button></div><small id="co-coupon-msg" class="err"></small><div id="co-sum" style="margin-top:8px"></div>' +
      '<div id="co-error" class="form-msg error hidden" role="alert"></div><button class="btn btn-block" id="place-btn" type="button">Place Demo Order</button><p class="muted" style="font-size:.78rem;text-align:center">No real payment will be taken.</p></aside></div>';
    renderAddrs(); renderPay(); renderItems(); renderSum();
  }
  function renderAddrs() {
    const me = Auth.user(), a = Store.addresses(me.id);
    if (!a.length) st.adding = true;
    if (!st.addrId && a.length) st.addrId = (a.find(x => x.isDefault) || a[0]).id;
    if (st.addrId && !a.some(x => x.id === st.addrId)) st.addrId = a.length ? a[0].id : null;
    const box = document.getElementById("co-addrs");
    box.innerHTML = a.map(x => '<label class="radio-card"><input type="radio" name="addr" value="' + x.id + '"' + (!st.adding && st.addrId === x.id ? " checked" : "") + '><span><b>' + U.esc(x.fullName) + '</b>' + (x.isDefault ? " (Default)" : "") + '<br><span class="muted">' + U.esc(x.house + ", " + x.locality + ", " + x.city + ", " + x.state + " - " + x.pin) + ' · 📞 ' + U.esc(x.phone) + '</span></span></label>').join("") +
      '<label class="radio-card"><input type="radio" name="addr" value="__new"' + (st.adding ? " checked" : "") + '><span><b>+ Add a new address</b></span></label>' +
      '<div id="new-addr" class="' + (st.adding ? "" : "hidden") + '">' + Addr.formHtml(P) + '</div>';
  }
  function renderPay() { document.getElementById("co-pay").innerHTML = PAY.map(p => '<label class="radio-card"><input type="radio" name="pay" value="' + p[0] + '"' + (st.payment === p[0] ? " checked" : "") + '><span>' + p[1] + '</span></label>').join(""); }
  function lines() { return Calc.lines(); }
  function renderItems() {
    const ls = lines(), box = document.getElementById("co-items");
    box.innerHTML = ls.length ? ls.map(l => '<div class="o-item"><img src="' + U.img(l.product) + '" alt="" data-fallback><div style="flex:1"><b>' + U.esc(l.product.name) + '</b><div class="muted" style="font-size:.8rem">Qty ' + l.qty + (l.size && l.size !== "Free Size" ? " · " + U.esc(l.size) : "") + (l.color ? " · " + U.esc(l.color) : "") + '</div></div><b>' + U.money(l.product.price * l.qty) + '</b></div>').join("") : "";
  }
  function renderSum() {
    const ls = lines(); let code = Calc.appliedCoupon(), t = Calc.totals(ls, code);
    if (code && !t.couponOk) { Store.remove(KEYS.appliedCoupon); code = ""; t = Calc.totals(ls, ""); }
    document.getElementById("co-coupon").value = code;
    document.getElementById("co-sum").innerHTML = '<div class="sum-row"><span>Price (' + t.items + ' items)</span><span>' + U.money(t.mrp) + '</span></div><div class="sum-row save"><span>Product discount</span><span>− ' + U.money(t.productDiscount) + '</span></div>' +
      (t.couponDiscount ? '<div class="sum-row save"><span>Coupon (' + U.esc(code) + ')</span><span>− ' + U.money(t.couponDiscount) + '</span></div>' : "") +
      '<div class="sum-row"><span>Delivery</span><span>' + (t.delivery ? U.money(t.delivery) : '<b class="save">FREE</b>') + '</span></div><div class="sum-row total"><span>Total</span><span>' + U.money(t.total) + '</span></div>';
  }
  function fail(m) { const e = document.getElementById("co-error"); e.textContent = m; e.classList.remove("hidden"); U.toast(m, "error"); }

  function place() {
    if (st.placing || st.done) return;                 // prevents duplicate orders on double click
    document.getElementById("co-error").classList.add("hidden");
    const me = Auth.user(); if (!me) { Auth.require(); return; }
    const cart = Store.cart(), ls = Calc.lines(cart);
    if (!ls.length) { fail("Your cart is empty."); return; }
    const bad = ls.find(l => l.clamped || l.requested > l.product.stock);
    if (bad) { fail('Only ' + bad.product.stock + ' of "' + bad.product.name + '" left in stock. Please update your cart.'); return; }
    let address;
    if (st.adding) {
      const d = Addr.read(P), errs = V.address(d); Addr.showErrors(P, errs);
      if (Object.keys(errs).length) { fail("Please fix the highlighted address fields."); return; }
      address = d;
    } else {
      address = Store.addresses(me.id).find(a => a.id === st.addrId);
      if (!address) { fail("Please select a delivery address."); return; }
    }
    st.placing = true; document.getElementById("place-btn").disabled = true;
    try {
      if (st.adding) {                                  // persist new address
        const all = Store.arr(KEYS.addresses), first = !all.some(a => a.userId === me.id);
        all.push(Object.assign({ id: "addr_" + Date.now().toString(36), userId: me.id, isDefault: first }, address)); Store.write(KEYS.addresses, all);
      }
      const code = Calc.appliedCoupon(), t = Calc.totals(ls, code);
      const prods = Store.products();
      ls.forEach(l => { const p = prods.find(x => x.id === l.product.id); p.stock = Math.max(0, p.stock - l.qty); });   // reduce inventory
      Store.saveProducts(prods);
      const order = {
        id: OrderOps.newId(), userId: me.id, createdAt: Date.now(), status: "Placed", history: [{ status: "Placed", at: Date.now() }],
        items: ls.map(l => ({ id: l.product.id, name: l.product.name, price: l.product.price, originalPrice: l.product.originalPrice, qty: l.qty, size: l.size, color: l.color, category: l.product.category, icon: l.product.icon, image: l.product.image })),
        address: { fullName: address.fullName, phone: address.phone, house: address.house, locality: address.locality, city: address.city, state: address.state, pin: address.pin },
        payment: PAY.find(p => p[0] === st.payment)[1], coupon: t.couponOk ? code : "", subtotal: t.subtotal, couponDiscount: t.couponDiscount, delivery: t.delivery, total: t.total
      };
      const orders = OrderOps.all(); orders.push(order); OrderOps.save(orders);
      Store.saveCart([]); Store.remove(KEYS.appliedCoupon);   // cleared ONLY after the order is saved
      st.done = true; refreshPage();
      root.innerHTML = '<div class="panel narrow success-box"><div class="tick">✓</div><h2>Order placed (demo)!</h2><p>Your order ID is</p><h3 style="color:var(--pink-dark)">' + U.esc(order.id) + '</h3><p class="muted">Total ' + U.money(order.total) + ' · ' + U.esc(order.payment) + '<br>This is a simulated order — no payment was processed.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="order-details.html?id=' + encodeURIComponent(order.id) + '">View order</a><a class="btn btn-outline" href="products.html">Continue shopping</a></div></div>';
    } catch (e) { st.placing = false; document.getElementById("place-btn").disabled = false; fail("Something went wrong placing the order. Please try again."); }
  }

  root.addEventListener("change", e => {
    if (e.target.name === "addr") { st.adding = e.target.value === "__new"; if (!st.adding) st.addrId = e.target.value; document.getElementById("new-addr").classList.toggle("hidden", !st.adding); }
    if (e.target.name === "pay") st.payment = e.target.value;
  });
  root.addEventListener("click", e => {
    if (e.target.closest("#place-btn")) place();
    if (e.target.closest("#co-apply")) {
      const code = document.getElementById("co-coupon").value.trim().toUpperCase(), m = document.getElementById("co-coupon-msg"), r = Calc.coupon(code, Calc.totals(lines(), "").subtotal);
      if (!code) { m.textContent = "Enter a coupon code"; return; }
      if (r.ok) { Store.write(KEYS.appliedCoupon, code); m.textContent = ""; U.toast(r.msg); renderSum(); } else m.textContent = r.msg;
    }
  });
  if (!Store.cart().length) { root.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><h2>Your cart is empty</h2><a class="btn" href="products.html">Continue shopping</a></div>'; return; }
  frame();
})();
