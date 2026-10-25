/* product-details.js - loads product from ?id= */
(function () {
  const root = document.getElementById("pd-root");
  const id = Number(U.qs("id")), p = Store.product(id);
  if (!id || !p) {
    root.innerHTML = '<div class="empty-state"><div class="empty-icon">😕</div><h2>Product not found</h2><p>The product you are looking for does not exist or was removed.</p><a class="btn" href="products.html">Browse products</a></div>';
    return;
  }
  document.title = p.name + " | Meesho Clone";
  Store.addRecent(p.id);
  const sel = { size: (p.sizes || [])[0] || "", color: (p.colors || [])[0] || "", qty: 1, img: 0 };
  const REVIEWS = [["Priya S.", 5, "Great quality for the price. Delivered on time!"], ["Rahul K.", 4, "Looks exactly like the pictures. Value for money."], ["Anita M.", 4, "Good product, packaging could be better."], ["Vikram P.", 3, "Decent. Size runs slightly small."]];

  function stockHtml() {
    if (p.stock <= 0) return '<span class="stock-out">Out of stock</span>';
    if (p.stock <= 10) return '<span class="stock-low">Only ' + p.stock + " left — order soon</span>";
    return '<span class="stock-ok">In stock (' + p.stock + " available)</span>";
  }
  function render() {
    const wished = Store.wishlist().includes(p.id), out = p.stock <= 0, maxQ = Math.max(1, p.stock);
    sel.qty = Math.max(1, Math.min(sel.qty, maxQ));
    const related = Store.products().filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
    root.innerHTML = '<nav class="muted" style="margin-bottom:12px;font-size:.85rem"><a href="index.html">Home</a> / <a href="products.html?cat=' + encodeURIComponent(p.category) + '">' + U.esc(p.category) + '</a> / ' + U.esc(p.name) + '</nav>' +
      '<div class="pd"><div><div class="gallery-main"><img id="main-img" src="' + U.img(p, sel.img) + '" alt="' + U.esc(p.name) + '" data-fallback></div><div class="thumbs">' +
      [0, 1, 2, 3].map(i => '<button type="button" class="' + (i === sel.img ? "active" : "") + '" data-thumb="' + i + '" aria-label="Image ' + (i + 1) + '"><img src="' + U.img(p, i) + '" alt=""></button>').join("") + '</div></div>' +
      '<div><h1>' + U.esc(p.name) + '</h1><div class="meta"><span class="rating">' + p.rating.toFixed(1) + ' ★</span><span class="muted">' + p.reviews.toLocaleString("en-IN") + ' ratings &amp; reviews</span></div>' +
      '<div class="price-row" style="margin:12px 0"><span class="pd-price">' + U.money(p.price) + '</span><span class="mrp" style="font-size:1.1rem">' + U.money(p.originalPrice) + '</span><span class="off" style="font-size:1.1rem">' + Calc.discountPct(p.originalPrice, p.price) + '% off</span></div>' +
      '<span class="free-del">Free Delivery on orders above ' + U.money(DELIVERY_RULES.freeAbove) + '</span><p>' + U.esc(p.description) + '</p><p>' + stockHtml() + '</p>' +
      ((p.sizes || []).length && p.sizes[0] !== "Free Size" ? '<div class="opt-label">Select Size</div><div class="pills" id="size-pills">' + p.sizes.map(s => '<button type="button" class="pill' + (s === sel.size ? " active" : "") + '" data-size="' + U.esc(s) + '">' + U.esc(s) + '</button>').join("") + '</div>' : "") +
      ((p.colors || []).length ? '<div class="opt-label">Select Color</div><div class="pills" id="color-pills">' + p.colors.map(c => '<button type="button" class="pill' + (c === sel.color ? " active" : "") + '" data-color="' + U.esc(c) + '">' + U.esc(c) + '</button>').join("") + '</div>' : "") +
      '<div class="opt-label">Quantity</div><div class="qty"><button type="button" id="q-minus" aria-label="Decrease quantity"' + (sel.qty <= 1 ? " disabled" : "") + '>−</button><span id="q-val">' + sel.qty + '</span><button type="button" id="q-plus" aria-label="Increase quantity"' + (sel.qty >= maxQ || out ? " disabled" : "") + '>+</button></div>' +
      '<div class="pd-actions"><button class="btn btn-outline" id="add-btn" type="button"' + (out ? " disabled" : "") + '>🛒 Add to Cart</button><button class="btn" id="buy-btn" type="button"' + (out ? " disabled" : "") + '>⚡ Buy Now</button>' +
      '<button class="btn btn-outline wish-text' + (wished ? " active" : "") + '" data-action="wish" data-id="' + p.id + '" type="button">' + (wished ? "♥ Wishlisted" : "♡ Add to Wishlist") + '</button></div>' +
      '<div class="panel" style="margin-bottom:16px"><div class="opt-label" style="margin-top:0">Check delivery</div><div class="pin-row"><input class="input" id="pin" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit PIN code" aria-label="PIN code"><button class="btn btn-dark" id="pin-btn" type="button">Check</button></div><small id="pin-msg" class="err" aria-live="polite"></small></div>' +
      '<div class="panel"><h3>Product details</h3><table class="spec"><tr><td>Category</td><td>' + U.esc(p.category) + '</td></tr><tr><td>Product ID</td><td>' + p.id + '</td></tr>' +
      ((p.sizes || []).length ? '<tr><td>Available sizes</td><td>' + U.esc(p.sizes.join(", ")) + '</td></tr>' : "") + ((p.colors || []).length ? '<tr><td>Colors</td><td>' + U.esc(p.colors.join(", ")) + '</td></tr>' : "") +
      '<tr><td>Country of origin</td><td>India</td></tr><tr><td>Returns</td><td>7-day easy returns (demo)</td></tr><tr><td>Tags</td><td>' + U.esc((p.keywords || []).join(", ")) + '</td></tr></table></div></div></div>' +
      '<section class="section" style="margin-top:30px"><h2>Ratings &amp; Reviews</h2><div class="panel">' + REVIEWS.map(r => '<div class="review"><b>' + r[0] + '</b> <span class="rating">' + r[1] + ' ★</span><br>' + r[2] + '</div>').join("") + '<p class="muted" style="margin:10px 0 0;font-size:.8rem">Sample reviews for demonstration.</p></div></section>' +
      '<section class="section"><h2>Related Products</h2><div class="product-grid" id="related"></div></section>';
    renderProducts(document.getElementById("related"), related, "No related products");
  }
  root.addEventListener("click", e => {
    const t = e.target;
    const th = t.closest("[data-thumb]"); if (th) { sel.img = Number(th.dataset.thumb); render(); return; }
    const sz = t.closest("[data-size]"); if (sz) { sel.size = sz.dataset.size; render(); return; }
    const co = t.closest("[data-color]"); if (co) { sel.color = co.dataset.color; render(); return; }
    if (t.closest("#q-minus")) { sel.qty--; render(); return; }
    if (t.closest("#q-plus")) { sel.qty++; render(); return; }
    if (t.closest("#add-btn")) { const r = Store.addToCart(p.id, sel.qty, sel.size, sel.color); U.toast(r.msg, r.ok ? "success" : "error"); refreshPage(); return; }
    if (t.closest("#buy-btn")) { const r = Store.addToCart(p.id, sel.qty, sel.size, sel.color); if (r.ok) location.href = "checkout.html"; else U.toast(r.msg, "error"); return; }
    if (t.closest("#pin-btn")) {
      const r = V.deliveryCheck(document.getElementById("pin").value.trim()), m = document.getElementById("pin-msg");
      m.textContent = r.msg; m.style.color = r.ok ? "var(--green)" : "var(--red)"; return;
    }
  });
  window.onDataChange = () => { const np = Store.product(id); if (np) { p.stock = np.stock; p.price = np.price; } };
  render();
})();
