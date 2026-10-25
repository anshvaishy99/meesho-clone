/* wishlist.js */
(function () {
  const grid = document.getElementById("wish-grid"), rm = document.getElementById("remove-all");
  function render() {
    const list = Store.wishlist().map(id => Store.product(id)).filter(Boolean);
    rm.classList.toggle("hidden", !list.length);
    if (!list.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">💖</div><h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it here.</p><a class="btn" href="products.html">Explore products</a></div>'; return; }
    grid.innerHTML = list.map(p => productCard(p).replace('data-action="add-cart"', 'data-action="move-cart"').replace(">Add to Cart<", ">Move to Cart<")).join("");
  }
  grid.addEventListener("click", e => {
    const b = e.target.closest('[data-action="move-cart"]'); if (!b) return;
    const r = Store.addToCart(b.dataset.id, 1);
    if (r.ok) { const w = Store.wishlist().filter(x => x !== Number(b.dataset.id)); Store.write(KEYS.wishlist, w); U.toast("Moved to cart"); } else U.toast(r.msg, "error");
    refreshPage();
  });
  rm.addEventListener("click", () => { if (confirm("Remove all items from your wishlist?")) { Store.write(KEYS.wishlist, []); refreshPage(); } });
  window.onDataChange = render; render();
})();
