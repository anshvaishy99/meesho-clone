/* cart.js */
(function () {
  const root = document.getElementById("cart-root");
  function summaryHtml(t, code, canCheckout) {
    return '<div class="sum-row"><span>Price (' + t.items + ' item' + (t.items === 1 ? "" : "s") + ')</span><span>' + U.money(t.mrp) + '</span></div>' +
      '<div class="sum-row save"><span>Product discount</span><span>− ' + U.money(t.productDiscount) + '</span></div>' +
      (t.couponDiscount ? '<div class="sum-row save"><span>Coupon (' + U.esc(code) + ')</span><span>− ' + U.money(t.couponDiscount) + '</span></div>' : "") +
      '<div class="sum-row"><span>Delivery</span><span>' + (t.delivery ? U.money(t.delivery) : '<b class="save">FREE</b>') + '</span></div>' +
      '<div class="sum-row total"><span>Total payable</span><span>' + U.money(t.total) + '</span></div>' +
      '<p class="save" style="font-size:.85rem;margin:6px 0 0">You save ' + U.money(t.productDiscount + t.couponDiscount + (t.delivery ? 0 : 0)) + ' on this order</p>';
  }
  function render() {
    let cart = Store.cart(), lines = Calc.lines(cart);
    // Normalise saved cart to what is actually valid (stock-clamped, existing products)
    const clean = lines.map(l => ({ id: l.product.id, qty: l.qty, size: l.size, color: l.color }));
    if (JSON.stringify(clean) !== JSON.stringify(cart)) { Store.saveCart(clean); updateBadges(); }
    if (!lines.length) {
      root.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><h2>Your cart is empty</h2><p>Add some products to get started.</p><a class="btn" href="products.html">Continue shopping</a></div>'; return;
    }
    let code = Calc.appliedCoupon(), t = Calc.totals(lines, code);
    if (code && !t.couponOk) { Store.remove(KEYS.appliedCoupon); code = ""; t = Calc.totals(lines, ""); }
    root.innerHTML = '<div class="cart-layout"><div class="panel"><div class="section-head"><b>' + t.items + ' items in your cart</b><button class="link-btn" id="clear-cart" type="button">Clear cart</button></div>' +
      lines.map((l, i) => {
        const p = l.product;
        return '<div class="line"><a href="product-details.html?id=' + p.id + '"><img src="' + U.img(p) + '" alt="' + U.esc(p.name) + '" data-fallback></a><div><a class="line-title" href="product-details.html?id=' + p.id + '">' + U.esc(p.name) + '</a>' +
          '<div class="line-opts">' + [l.size && l.size !== "Free Size" ? "Size: " + U.esc(l.size) : "", l.color ? "Color: " + U.esc(l.color) : ""].filter(Boolean).join(" · ") + '</div>' +
          '<div class="line-actions"><div class="qty"><button type="button" data-act="dec" data-i="' + i + '" aria-label="Decrease quantity">−</button><span>' + l.qty + '</span><button type="button" data-act="inc" data-i="' + i + '" aria-label="Increase quantity"' + (l.qty >= p.stock ? " disabled" : "") + '>+</button></div>' +
          '<button class="link-btn" type="button" data-act="rm" data-i="' + i + '">Remove</button></div>' + (l.qty >= p.stock ? '<div class="stock-warn">Max available stock reached (' + p.stock + ')</div>' : "") + '</div>' +
          '<div class="line-price" style="text-align:right"><b>' + U.money(p.price * l.qty) + '</b><div class="mrp">' + U.money(p.originalPrice * l.qty) + '</div></div></div>';
      }).join("") + '<a class="btn btn-outline" href="products.html" style="margin-top:12px">← Continue shopping</a></div>' +
      '<aside class="panel summary"><h3>Order summary</h3>' +
      '<div class="coupon-row"><input class="input" id="coupon-input" placeholder="Coupon code" value="' + U.esc(code) + '" aria-label="Coupon code"><button class="btn btn-dark btn-sm" id="apply-coupon" type="button">' + (code ? "Re-apply" : "Apply") + '</button></div>' +
      '<small id="coupon-msg" class="' + (code ? "save" : "err") + '">' + (code ? U.esc(code) + " applied" : "") + '</small>' + (code ? ' <button class="link-btn" id="remove-coupon" type="button">Remove</button>' : "") +
      '<div style="margin-top:8px">' + summaryHtml(t, code) + '</div>' +
      '<p class="muted" style="font-size:.8rem">Free delivery on orders ≥ ' + U.money(DELIVERY_RULES.freeAbove) + ', otherwise ' + U.money(DELIVERY_RULES.charge) + '. Try WELCOME10, SAVE100, FREESHIP.</p>' +
      '<a class="btn btn-block" href="checkout.html">Proceed to Checkout</a></aside></div>';
  }
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (b) {
      const cart = Store.cart(), lines = Calc.lines(cart), l = lines[Number(b.dataset.i)]; if (!l) return;
      const idx = cart.findIndex(c => c.id === l.product.id && c.size === l.size && c.color === l.color);
      if (idx < 0) return;
      const total = cart.filter(c => c.id === l.product.id).reduce((s, c) => s + c.qty, 0);
      if (b.dataset.act === "inc") { if (total + 1 > l.product.stock) { U.toast("Only " + l.product.stock + " in stock", "error"); return; } cart[idx].qty++; }
      else if (b.dataset.act === "dec") { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
      else cart.splice(idx, 1);
      Store.saveCart(cart); refreshPage(); render(); return;
    }
    if (e.target.closest("#clear-cart")) { if (confirm("Remove all items from your cart?")) { Store.saveCart([]); Store.remove(KEYS.appliedCoupon); refreshPage(); render(); } return; }
    if (e.target.closest("#apply-coupon")) {
      const code = document.getElementById("coupon-input").value.trim().toUpperCase(), lines = Calc.lines(), sub = Calc.totals(lines, "").subtotal;
      const r = Calc.coupon(code, sub); const m = document.getElementById("coupon-msg");
      if (!code) { m.className = "err"; m.textContent = "Enter a coupon code"; return; }
      if (r.ok) { Store.write(KEYS.appliedCoupon, code); U.toast(r.msg); render(); } else { m.className = "err"; m.textContent = r.msg; }
      return;
    }
    if (e.target.closest("#remove-coupon")) { Store.remove(KEYS.appliedCoupon); render(); }
  });
  window.onDataChange = render;
  render();
})();
