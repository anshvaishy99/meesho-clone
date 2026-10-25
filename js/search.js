/* search.js - search by name, category, description and keywords */
(function () {
  const input = document.getElementById("search-input"), form = document.getElementById("search-form"), sugg = document.getElementById("suggestions"),
    recentBox = document.getElementById("recent-box"), results = document.getElementById("results"), summary = document.getElementById("search-summary");
  function score(p, tokens) {
    let total = 0;
    for (const t of tokens) {
      let s = 0;
      if (p.name.toLowerCase().includes(t)) s += 5;
      if ((p.keywords || []).some(k => k.toLowerCase().includes(t))) s += 3;
      if (p.category.toLowerCase().includes(t)) s += 2;
      if ((p.description || "").toLowerCase().includes(t)) s += 1;
      if (!s) return 0;                       // every word must match something
      total += s;
    }
    return total;
  }
  function search(q) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return tokens.length ? Store.products().map(p => ({ p, s: score(p, tokens) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || b.p.rating - a.p.rating).map(x => x.p) : [];
  }
  function renderRecent() {
    const r = Store.arr(KEYS.searches);
    recentBox.innerHTML = r.length ? '<div class="section-head"><b>Recent searches</b><button class="link-btn" id="clear-history" type="button">Clear history</button></div><div class="chips">' + r.map(s => '<button class="chip" type="button" data-q="' + U.esc(s) + '">🕘 ' + U.esc(s) + '</button>').join("") + '</div>' : "";
  }
  function run(q) {
    q = q.trim(); input.value = q;
    if (!q) { results.innerHTML = ""; summary.textContent = "Type something to search our catalogue."; return; }
    Store.addSearch(q); renderRecent(); history.replaceState(null, "", "search.html?q=" + encodeURIComponent(q));
    const list = search(q); summary.innerHTML = list.length ? "<b>" + list.length + "</b> result" + (list.length === 1 ? "" : "s") + ' for "' + U.esc(q) + '"' : "";
    renderProducts(results, list, 'No results for "' + q + '". Check the spelling or try a different keyword like "kurti" or "shoes".'); sugg.classList.add("hidden");
  }
  function suggest() {
    const q = input.value.trim().toLowerCase(); if (q.length < 1) { sugg.classList.add("hidden"); return; }
    const set = new Set(); Store.products().forEach(p => { if (p.name.toLowerCase().includes(q)) set.add(p.name); (p.keywords || []).forEach(k => { if (k.toLowerCase().startsWith(q)) set.add(k); }); if (p.category.toLowerCase().includes(q)) set.add(p.category); });
    const items = Array.from(set).slice(0, 7);
    sugg.innerHTML = items.map(s => '<button type="button" data-q="' + U.esc(s) + '">🔍 ' + U.esc(s) + '</button>').join(""); sugg.classList.toggle("hidden", !items.length);
  }
  form.addEventListener("submit", e => { e.preventDefault(); run(input.value); });
  input.addEventListener("input", U.debounce(suggest, 120));
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-q]"); if (b && (sugg.contains(b) || recentBox.contains(b))) { run(b.dataset.q); return; }
    if (e.target.closest("#clear-history")) { Store.write(KEYS.searches, []); renderRecent(); }
    if (!e.target.closest(".suggest-box")) sugg.classList.add("hidden");
  });
  renderRecent(); const q0 = U.qs("q"); if (q0) run(q0); else summary.textContent = "Type something to search our catalogue.";
  window.onDataChange = () => { const q = input.value.trim(); if (q) renderProducts(results, search(q), 'No results for "' + q + '".'); renderRecent(); };
})();
