/* Offerte-pagina Mor Ephrem Bookshop
   - Laadt producten uit products.json
   - Laat bezoeker aantallen kiezen, toont richtprijs
   - Vult het formulier automatisch met de selectie (verzending via Netlify Forms) */

const STORE_URL = "https://morephrem.shop/products/";
const state = { products: [], qty: {} }; // qty: { index: aantal }

const euro = (n) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const catalogEl = document.getElementById("catalog");
const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("category");
const resultCountEl = document.getElementById("result-count");
const emptyEl = document.getElementById("empty");

init();

async function init() {
  try {
    const res = await fetch("products.json");
    state.products = await res.json();
  } catch (e) {
    catalogEl.innerHTML =
      '<p class="empty">De boekenlijst kon niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>';
    return;
  }
  buildCategoryOptions();
  render();
  searchEl.addEventListener("input", render);
  categoryEl.addEventListener("change", render);
  document.getElementById("offerteForm").addEventListener("submit", onSubmit);
}

function buildCategoryOptions() {
  const cats = [...new Set(state.products.map((p) => p.type || "Overig"))].sort((a, b) =>
    a.localeCompare(b, "nl")
  );
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryEl.appendChild(opt);
  }
}

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  const cat = categoryEl.value;
  return state.products
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const matchCat = !cat || (p.type || "Overig") === cat;
      const matchQ = !q || p.title.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
}

function render() {
  const items = filtered();
  resultCountEl.textContent = `${items.length} titel${items.length === 1 ? "" : "s"} weergegeven`;
  emptyEl.hidden = items.length > 0;

  // Groepeer op categorie
  const groups = {};
  for (const it of items) {
    const cat = it.p.type || "Overig";
    (groups[cat] ||= []).push(it);
  }
  const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b, "nl"));

  catalogEl.innerHTML = "";
  for (const cat of sortedCats) {
    const group = document.createElement("section");
    group.className = "cat-group";
    const h3 = document.createElement("h3");
    h3.textContent = cat;
    group.appendChild(h3);

    const grid = document.createElement("div");
    grid.className = "cat-items";
    for (const { p, i } of groups[cat]) grid.appendChild(productCard(p, i));
    group.appendChild(grid);
    catalogEl.appendChild(group);
  }
}

function productCard(p, i) {
  const card = document.createElement("article");
  card.className = "product" + (state.qty[i] ? " selected" : "");

  const thumb = p.img
    ? `<img class="thumb" src="${p.img}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'thumb placeholder',textContent:'ܟ'}))" />`
    : `<div class="thumb placeholder">ܟ</div>`;

  const link = p.handle ? `${STORE_URL}${p.handle}` : "https://morephrem.shop";
  const val = state.qty[i] || 0;

  card.innerHTML = `
    ${thumb}
    <div class="info">
      <p class="title">${escapeHtml(p.title)}</p>
      <p class="price">${euro(p.price)} · <a href="${link}" target="_blank" rel="noopener">bekijk</a></p>
      <div class="qty">
        <button type="button" aria-label="Minder">−</button>
        <input type="number" min="0" inputmode="numeric" value="${val || ""}" placeholder="0" aria-label="Aantal" />
        <button type="button" aria-label="Meer">+</button>
      </div>
    </div>`;

  const [minus, plus] = card.querySelectorAll(".qty button");
  const input = card.querySelector(".qty input");

  const set = (n) => {
    n = Math.max(0, Math.floor(n || 0));
    if (n) state.qty[i] = n;
    else delete state.qty[i];
    input.value = n || "";
    card.classList.toggle("selected", !!n);
    updateSummary();
  };

  minus.addEventListener("click", () => set((state.qty[i] || 0) - 1));
  plus.addEventListener("click", () => set((state.qty[i] || 0) + 1));
  input.addEventListener("input", () => set(parseInt(input.value, 10)));

  return card;
}

function selection() {
  return Object.keys(state.qty).map((i) => ({
    p: state.products[i],
    qty: state.qty[i],
  }));
}

function totals() {
  const sel = selection();
  const copies = sel.reduce((s, x) => s + x.qty, 0);
  const price = sel.reduce((s, x) => s + x.qty * x.p.price, 0);
  return { titles: sel.length, copies, price, sel };
}

function updateSummary() {
  const { titles, copies, price, sel } = totals();
  const box = document.getElementById("summary-items");

  if (!sel.length) {
    box.innerHTML =
      '<p class="summary-empty">Nog niets geselecteerd. Voeg hierboven titels en aantallen toe.</p>';
  } else {
    box.innerHTML = sel
      .map(
        (x) => `
        <div class="sum-row">
          <span class="sr-name">${escapeHtml(x.p.title)}</span>
          <span class="sr-qty">${x.qty}×</span>
          <span class="sr-price">${euro(x.qty * x.p.price)}</span>
        </div>`
      )
      .join("");
  }

  document.getElementById("sum-titles").textContent = titles;
  document.getElementById("sum-copies").textContent = copies;
  document.getElementById("sum-price").textContent = euro(price);

  // Synchroniseer met het formulier
  document.getElementById("aantalTitelsField").value = titles;
  document.getElementById("totaalField").value = copies;
  document.getElementById("richtprijsField").value = euro(price);
  document.getElementById("bestellingField").value = sel
    .map((x) => `${x.qty}× ${x.p.title} (${euro(x.p.price)}/st) = ${euro(x.qty * x.p.price)}`)
    .join("\n");

  const fs = document.getElementById("formSummary");
  fs.textContent = sel.length
    ? `Geselecteerd: ${titles} titel(s), ${copies} exemplaren — richtprijs ${euro(price)} (excl. verzending).`
    : "";
}

async function onSubmit(e) {
  e.preventDefault(); // wij regelen de verzending zelf (AJAX)
  const form = document.getElementById("offerteForm");
  const err = document.getElementById("formError");
  const btn = form.querySelector('button[type="submit"]');

  const { titles } = totals();
  if (titles === 0) {
    err.textContent = "Selecteer eerst minimaal één titel hierboven.";
    err.hidden = false;
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  err.hidden = true;

  // Bouw de form-data (inclusief form-name, nodig voor Netlify Forms)
  const data = new URLSearchParams(new FormData(form));

  btn.disabled = true;
  const oldLabel = btn.textContent;
  btn.textContent = "Bezig met versturen…";

  try {
    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data.toString(),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    window.location.href = "bedankt.html";
  } catch (e2) {
    btn.disabled = false;
    btn.textContent = oldLabel;
    err.innerHTML =
      "Versturen lukte niet. Staat de site al op Netlify én is <em>Forms</em> ingeschakeld? " +
      "Controleer in Netlify of het formulier &lsquo;offerte&rsquo; verschijnt onder <strong>Forms</strong> " +
      "(her-deploy de site na wijzigingen). Lukt het niet, mail uw aanvraag dan rechtstreeks via de webshop.";
    err.hidden = false;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
