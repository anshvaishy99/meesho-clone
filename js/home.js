/* home.js - home page sections */
(function () {
  const slides = [
    { cls: "s1", h: "Lowest Prices. Free Delivery.", p: "Fashion, home & more — starting at just ₹149", icon: "🛍️", link: "products.html" },
    { cls: "s2", h: "Festive Sale: Up to 70% Off", p: "Ethnic wear, decor and lights for every celebration", icon: "🪔", link: "products.html?sort=discount" },
    { cls: "s3", h: "New Arrivals Are Here", p: "Fresh styles added this week", icon: "✨", link: "products.html?sort=newest" }
  ];
  let cur = 0, timer;
  function renderHero() {
    const hero = document.getElementById("hero");
    hero.innerHTML = slides.map((s, i) => '<div class="slide ' + s.cls + (i === 0 ? " active" : "") + '"><div><h1>' + s.h + '</h1><p>' + s.p + '</p><a class="btn" href="' + s.link + '">Shop Now</a></div><div class="big" aria-hidden="true">' + s.icon + '</div></div>').join("") +
      '<div class="dots">' + slides.map((_, i) => '<button type="button" aria-label="Slide ' + (i + 1) + '" data-i="' + i + '"' + (i === 0 ? ' class="active"' : "") + '></button>').join("") + '</div>';
    hero.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) { show(Number(b.dataset.i)); restart(); } });
  }
  function show(i) {
    cur = i; document.querySelectorAll("#hero .slide").forEach((s, k) => s.classList.toggle("active", k === i));
    document.querySelectorAll("#hero .dots button").forEach((d, k) => d.classList.toggle("active", k === i));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => show((cur + 1) % slides.length), 5000); }

  function renderAll() {
    const all = Store.products();
    const by = (fn) => all.slice().sort(fn);
    renderProducts(document.getElementById("featured"), all.filter(p => p.featured).slice(0, 8), "No featured products yet");
    renderProducts(document.getElementById("bestsellers"), by((a, b) => b.reviews - a.reviews).slice(0, 8));
    renderProducts(document.getElementById("new-arrivals"), all.filter(p => p.isNew).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8), "No new arrivals");
    renderProducts(document.getElementById("deals"), by((a, b) => Calc.discountPct(b.originalPrice, b.price) - Calc.discountPct(a.originalPrice, a.price)).slice(0, 8));
    renderProducts(document.getElementById("recommended"), by((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 8));
    const recent = Store.arr(KEYS.recent).map(id => Store.product(id)).filter(Boolean).slice(0, 8);
    document.getElementById("recent-section").classList.toggle("hidden", !recent.length);
    if (recent.length) renderProducts(document.getElementById("recent"), recent);
  }
  function renderStatic() {
    document.getElementById("cat-tiles").innerHTML = Store.categories().map(c => '<a class="cat-tile" href="products.html?cat=' + encodeURIComponent(c.name) + '"><span>' + c.icon + '</span>' + U.esc(c.name) + '</a>').join("");
    const offers = Store.coupons().filter(c => c.active && new Date(c.expiry + "T23:59:59") >= new Date()).slice(0, 3);
    document.getElementById("offers").innerHTML = offers.map(c => '<div class="offer"><b>' + U.esc(c.code) + '</b><br>' + U.esc(c.description || "") + '</div>').join("");
  }
  renderHero(); renderStatic(); renderAll(); restart();
  window.onDataChange = renderAll;
})();
