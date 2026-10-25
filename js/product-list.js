/* product-list.js - filtering, sorting, load more */
(function () {
  const PAGE = 12;
  const state = { cats: [], min: "", max: "", rating: 0, sort: "relevance", q: "", shown: PAGE };
  const $ = id => document.getElementById(id);
  const sp = new URLSearchParams(location.search);
  if (sp.get("cat")) state.cats = [sp.get("cat")];
  if (sp.get("sort")) state.sort = sp.get("sort");
  if (sp.get("q")) state.q = sp.get("q");
  $("sort").value = state.sort; if ($("sort").value !== state.sort) { state.sort = "relevance"; $("sort").value = "relevance"; }

  function renderCats() {
    $("f-cats").innerHTML = Store.categories().map(c => '<label class="opt"><input type="checkbox" value="' + U.esc(c.name) + '"' + (state.cats.includes(c.name) ? " checked" : "") + '> ' + U.esc(c.name) + '</label>').join("");
  }
  function filtered() {
    const min = state.min === "" ? 0 : Number(state.min), max = state.max === "" ? Infinity : Number(state.max), q = state.q.toLowerCase();
    let list = Store.products().filter(p =>
      (!state.cats.length || state.cats.includes(p.category)) && p.price >= min && p.price <= max && p.rating >= state.rating &&
      (!q || (p.name + " " + p.category + " " + p.description + " " + (p.keywords || []).join(" ")).toLowerCase().includes(q)));
    const s = {
      "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating,
      discount: (a, b) => Calc.discountPct(b.originalPrice, b.price) - Calc.discountPct(a.originalPrice, a.price),
      newest: (a, b) => b.createdAt - a.createdAt, reviews: (a, b) => b.reviews - a.reviews
    }[state.sort];
    if (s) list.sort(s);
    return list;
  }
  function render() {
    const list = filtered(), part = list.slice(0, state.shown);
    $("count").textContent = list.length;
    renderProducts($("grid"), part, "No products match your filters. Try clearing them.");
    $("load-more").classList.toggle("hidden", list.length <= state.shown);
    $("list-title").textContent = state.q ? 'Results for "' + state.q + '"' : state.cats.length === 1 ? state.cats[0] : "All Products";
    const chips = [];
    state.cats.forEach(c => chips.push(["cat:" + c, c]));
    if (state.min !== "" || state.max !== "") chips.push(["price", "₹" + (state.min || 0) + " – " + (state.max === "" ? "any" : "₹" + state.max)]);
    if (state.rating) chips.push(["rating", state.rating + "★ & above"]);
    if (state.q) chips.push(["q", '"' + state.q + '"']);
    $("chips").innerHTML = chips.map(c => '<button class="chip" type="button" data-chip="' + U.esc(c[0]) + '">' + U.esc(c[1]) + ' ✕</button>').join("");
  }
  function reset() { state.shown = PAGE; render(); }
  function clearAll() {
    Object.assign(state, { cats: [], min: "", max: "", rating: 0, q: "", sort: "relevance", shown: PAGE });
    $("f-min").value = ""; $("f-max").value = ""; $("sort").value = "relevance"; document.querySelector('input[name="f-rating"][value="0"]').checked = true; renderCats(); render();
  }
  $("f-cats").addEventListener("change", () => { state.cats = Array.from($("f-cats").querySelectorAll("input:checked")).map(i => i.value); reset(); });
  const onPrice = U.debounce(() => { state.min = $("f-min").value; state.max = $("f-max").value; reset(); }, 250);
  $("f-min").addEventListener("input", onPrice); $("f-max").addEventListener("input", onPrice);
  document.querySelectorAll('input[name="f-rating"]').forEach(r => r.addEventListener("change", () => { state.rating = Number(r.value); reset(); }));
  $("sort").addEventListener("change", e => { state.sort = e.target.value; reset(); });
  $("clear-filters").addEventListener("click", clearAll);
  $("load-more").addEventListener("click", () => { state.shown += PAGE; render(); });
  $("open-filters").addEventListener("click", () => $("filters").classList.add("open"));
  $("close-filters").addEventListener("click", () => $("filters").classList.remove("open"));
  $("chips").addEventListener("click", e => {
    const c = e.target.closest("[data-chip]"); if (!c) return; const k = c.dataset.chip;
    if (k.startsWith("cat:")) state.cats = state.cats.filter(x => x !== k.slice(4));
    else if (k === "price") { state.min = state.max = ""; $("f-min").value = $("f-max").value = ""; }
    else if (k === "rating") { state.rating = 0; document.querySelector('input[name="f-rating"][value="0"]').checked = true; }
    else if (k === "q") state.q = "";
    renderCats(); reset();
  });
  renderCats(); render();
  window.onDataChange = render;
})();
