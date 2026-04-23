/* assets/js/products.js
   - Loads products.json
   - Builds filter UI (brands/colors/styles)
   - Applies filters + sort
   - URL params support: q, gender, style, offer, sort
   - Load more pagination
   - Add to cart uses window.FM_CART from app.js (with fallback)
*/

(function () {
  const $ = (id) => document.getElementById(id);

  const productGrid = $('productGrid');
  const noResults = $('noResults');
  const btnNoResultsReset = $('btnNoResultsReset');
  const btnLoadMore = $('btnLoadMore');
  const resultCount = $('resultCount');
  const sortSelect = $('sortSelect');

  // Filters
  const qInput = $('qInput');
  const genderChks = document.querySelectorAll('.genderChk');
  const brandList = $('brandList');
  const btnBrandAll = $('btnBrandAll');

  const priceMin = $('priceMin');
  const priceMax = $('priceMax');
  const priceHint = $('priceHint');
  const btnPriceReset = $('btnPriceReset');

  const colorRow = $('colorRow');
  const styleRow = $('styleRow');

  const togglePopular = $('togglePopular');
  const toggleOffer = $('toggleOffer');

  const btnApplyFilters = $('btnApplyFilters');
  const activeChips = $('activeChips');
  const btnClearAll = $('btnClearAll');

  // Mobile filters drawer
  const btnOpenFilters = $('btnOpenFilters');
  const filtersBackdrop = $('filtersBackdrop');
  const filtersDrawer = $('filtersDrawer');
  const filtersDrawerInner = $('filtersDrawerInner');
  const filtersCard = $('filtersCard');

  // State
  let all = [];
  let view = [];
  let pageSize = 12;
  let page = 1;

  const state = {
    q: '',
    genders: new Set(),   // male/female/boys/girls
    brands: new Set(),
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    colors: new Set(),
    styles: new Set(),
    onlyPopular: false,
    onlyOffer: false,
    sort: 'featured'
  };

  // ---------------------------
  // Helpers
  // ---------------------------
  function safeJSONParse(value, fallback) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function normalizeColor(c) {
    return String(c || '').trim().toLowerCase();
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function capitalize(s) {
    const t = String(s || '');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function emojiColor(c) {
    const x = normalizeColor(c);
    const map = {
      black: '⚫', white: '⚪', gray: '🩶', navy: '🔵', blue: '🔵',
      red: '🔴', pink: '🩷', cream: '🟡', beige: '🟤', brown: '🟤',
      olive: '🟢', khaki: '🟤', orange: '🟠', maroon: '🟤', charcoal: '⚫'
    };
    return map[x] || '🎨';
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function stars(r) {
    const rating = Number(r || 0);
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    let s = '★'.repeat(full) + (half ? '☆' : '');
    return s || '—';
  }

  // ---------------------------
  // Cart fallback (if FM_CART missing)
  // ---------------------------
  function cartFallbackAdd(product) {
    // Stored same as app.js: fm_cart = [{id,title,price,img,qty}]
    const cart = safeJSONParse(localStorage.getItem('fm_cart'), []);
    const exists = cart.find(x => x.id === product.id);
    if (exists) exists.qty = (Number(exists.qty) || 1) + 1;
    else cart.push({ ...product, qty: 1 });
    localStorage.setItem('fm_cart', JSON.stringify(cart));

    // Try open cart (if button exists)
    const btn = document.getElementById('btnCart');
    if (btn) btn.click();
    else alert('Added to cart ✅');
  }

  function addToCart(product) {
    if (window.FM_CART && typeof window.FM_CART.add === 'function') {
      window.FM_CART.add(product);
      if (typeof window.FM_CART.open === 'function') window.FM_CART.open();
      return;
    }
    cartFallbackAdd(product);
  }

  // ---------------------------
  // URL params
  // ---------------------------
  function parseParams() {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q') || '';
    const gender = url.searchParams.get('gender') || '';
    const style = url.searchParams.get('style') || '';
    const offer = url.searchParams.get('offer') || '';
    const sort = url.searchParams.get('sort') || '';

    if (q) state.q = q;
    if (gender) state.genders.add(gender.toLowerCase());
    if (style) state.styles.add(style.toLowerCase());
    if (offer === '1' || offer === 'true') state.onlyOffer = true;
    if (sort) state.sort = sort;

    // reflect UI
    if (qInput) qInput.value = state.q;
    genderChks.forEach(chk => { chk.checked = state.genders.has(chk.value); });
    if (sortSelect) sortSelect.value = state.sort;
    updateToggleUI();
  }

  function updateToggleUI() {
    if (togglePopular) {
      togglePopular.classList.toggle('bg-slate-900', state.onlyPopular);
      togglePopular.classList.toggle('text-white', state.onlyPopular);
    }
    if (toggleOffer) {
      toggleOffer.classList.toggle('bg-slate-900', state.onlyOffer);
      toggleOffer.classList.toggle('text-white', state.onlyOffer);
    }
  }

  // ---------------------------
  // Data
  // ---------------------------
  async function loadData() {
    const res = await fetch('assets/data/products.json');
    all = await res.json();
  }

  // ---------------------------
  // Build filter UI
  // ---------------------------
  function buildBrandUI() {
    if (!brandList) return;

    const brands = uniq(all.map(p => p.brand)).sort((a, b) => a.localeCompare(b));
    brandList.innerHTML = brands.map(b => `
      <label class="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30">
        <input type="checkbox" class="brandChk accent-teal-500" value="${escapeHtml(b)}" />
        <span>${escapeHtml(b)}</span>
      </label>
    `).join('');

    brandList.querySelectorAll('.brandChk').forEach(chk => {
      chk.addEventListener('change', () => {
        if (chk.checked) state.brands.add(chk.value);
        else state.brands.delete(chk.value);
        applyAndRender();
      });
    });

    btnBrandAll?.addEventListener('click', (e) => {
      e.preventDefault();

      const chks = brandList.querySelectorAll('.brandChk');
      const anyChecked = Array.from(chks).some(c => c.checked);

      state.brands.clear();
      chks.forEach(c => {
        c.checked = !anyChecked;
        if (!anyChecked) state.brands.add(c.value);
      });

      applyAndRender();
    });
  }

  function buildColorUI() {
    if (!colorRow) return;

    const colors = uniq(all.flatMap(p => (p.colors || []).map(normalizeColor))).filter(Boolean);
    const order = ['black', 'white', 'gray', 'navy', 'blue', 'red', 'pink', 'cream', 'beige', 'brown', 'olive', 'khaki', 'orange', 'maroon', 'charcoal'];
    colors.sort((a, b) => (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b)) || a.localeCompare(b));

    colorRow.innerHTML = colors.map(c => `
      <button type="button" data-color="${c}"
        class="colorChip px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs font-semibold">
        ${emojiColor(c)} ${capitalize(c)}
      </button>
    `).join('');

    colorRow.querySelectorAll('.colorChip').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.color;
        if (state.colors.has(c)) state.colors.delete(c);
        else state.colors.add(c);
        applyAndRender();
      });
    });
  }

  function buildStyleUI() {
    if (!styleRow) return;

    const styles = uniq(all.flatMap(p => (p.styles || []).map(s => String(s).toLowerCase())))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    styleRow.innerHTML = styles.map(s => `
      <button type="button" data-style="${s}"
        class="styleChip px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs font-semibold">
        ${capitalize(s)}
      </button>
    `).join('');

    styleRow.querySelectorAll('.styleChip').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.style;
        if (state.styles.has(s)) state.styles.delete(s);
        else state.styles.add(s);
        applyAndRender();
      });
    });
  }

  // ---------------------------
  // Apply filters + sort
  // ---------------------------
  function applyFilters(list) {
    const q = state.q.trim().toLowerCase();

    return list
      .filter(p => {
        if (!q) return true;
        const hay = `${p.title} ${p.brand} ${(p.styles || []).join(' ')} ${(p.colors || []).join(' ')} ${p.gender}`.toLowerCase();
        return hay.includes(q);
      })
      .filter(p => state.genders.size === 0 ? true : state.genders.has(String(p.gender).toLowerCase()))
      .filter(p => state.brands.size === 0 ? true : state.brands.has(p.brand))
      .filter(p => state.minPrice == null ? true : Number(p.price) >= Number(state.minPrice))
      .filter(p => state.maxPrice == null ? true : Number(p.price) <= Number(state.maxPrice))
      .filter(p => Number(p.rating || 0) >= Number(state.minRating || 0))
      .filter(p => state.onlyOffer ? !!p.offer : true)
      .filter(p => state.onlyPopular ? Number(p.popular || 0) >= 80 : true)
      .filter(p => {
        if (state.colors.size === 0) return true;
        const pc = new Set((p.colors || []).map(normalizeColor));
        for (const c of state.colors) if (pc.has(c)) return true;
        return false;
      })
      .filter(p => {
        if (state.styles.size === 0) return true;
        const ps = new Set((p.styles || []).map(s => String(s).toLowerCase()));
        for (const s of state.styles) if (ps.has(s)) return true;
        return false;
      });
  }

  function applySort(list) {
    const sort = state.sort || 'featured';
    const copy = [...list];

    if (sort === 'price_low') copy.sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') copy.sort((a, b) => b.price - a.price);
    else if (sort === 'rating_high') copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'popular') copy.sort((a, b) => (b.popular || 0) - (a.popular || 0));
    else if (sort === 'az') copy.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    else {
      // featured = mix popular + rating
      copy.sort((a, b) => ((b.popular || 0) * 0.7 + (b.rating || 0) * 10) - ((a.popular || 0) * 0.7 + (a.rating || 0) * 10));
    }
    return copy;
  }

  // ---------------------------
  // Render
  // ---------------------------
  function cardHTML(p) {
    // ✅ Button always visible on mobile (no hover requirement)
    // ✅ Hover animation only on md+
    return `
      <div class="group rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-lg transition">
        <div class="relative aspect-[4/5] overflow-hidden">
          <img src="${p.img}" alt="${escapeHtml(p.title)}"
               class="h-full w-full object-cover md:group-hover:scale-110 transition duration-500" />

          <div class="absolute top-3 left-3 flex gap-2">
            <span class="text-[11px] px-3 py-1 rounded-full bg-white/90 text-slate-900 font-semibold">
              ${String(p.gender).toUpperCase()}
            </span>
            ${p.offer ? `<span class="text-[11px] px-3 py-1 rounded-full bg-teal-500 text-slate-900 font-semibold">OFFER</span>` : ``}
          </div>

          <button data-add="${p.id}"
  class="absolute bottom-3 left-3 right-3 py-3 rounded-2xl bg-teal-500 text-slate-900 font-semibold hover:bg-teal-400 transition
         opacity-100 translate-y-0
         md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0">
  Add to cart
</button>
        </div>

        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold truncate">${escapeHtml(p.title)}</p>
              <p class="text-xs opacity-70 mt-1">
                ${escapeHtml(p.brand)} • ${stars(p.rating)}
                <span class="opacity-60">(${Number(p.rating || 0).toFixed(1)})</span>
              </p>

              <div class="mt-2 flex flex-wrap gap-1">
                ${(p.styles || []).slice(0, 2).map(s => `
                  <span class="text-[11px] px-2 py-1 rounded-full border border-slate-200 dark:border-slate-800 opacity-80">
                    ${escapeHtml(capitalize(s))}
                  </span>
                `).join('')}
              </div>
            </div>

            <p class="font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap">
              ₹${Number(p.price).toFixed(0)}
            </p>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            ${(p.colors || []).slice(0, 3).map(c => `
              <button type="button" data-quick-color="${normalizeColor(c)}"
                class="quickColor text-xs px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                ${emojiColor(c)} ${capitalize(c)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderProducts() {
    if (!productGrid) return;

    const end = page * pageSize;
    const slice = view.slice(0, end);

    productGrid.innerHTML = slice.map(p => cardHTML(p)).join('');

    // bind add-to-cart
    productGrid.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = btn.dataset.add;
        const p = all.find(x => x.id === id);
        if (!p) return;

        addToCart({ id: p.id, title: p.title, price: Number(p.price), img: p.img });
      }, { passive: false });
    });

    // counts & empty state
    if (resultCount) resultCount.textContent = String(view.length);

    if (view.length === 0) {
      noResults?.classList.remove('hidden');
      btnLoadMore?.classList.add('hidden');
    } else {
      noResults?.classList.add('hidden');
      btnLoadMore?.classList.toggle('hidden', end >= view.length);
    }

    renderChips();
  }

  function applyAndRender() {
    page = 1;

    // capture inputs -> state
    state.q = (qInput?.value || '').trim();

    // price
    const min = (priceMin?.value || '').trim();
    const max = (priceMax?.value || '').trim();
    state.minPrice = min !== '' ? Number(min) : null;
    state.maxPrice = max !== '' ? Number(max) : null;

    if (priceHint) {
      if (state.minPrice == null && state.maxPrice == null) priceHint.textContent = 'Set your range';
      else priceHint.textContent = `Range: ${state.minPrice ?? 0} → ${state.maxPrice ?? '∞'}`;
    }

    // genders from checkboxes
    state.genders.clear();
    genderChks.forEach(chk => { if (chk.checked) state.genders.add(chk.value); });

    // sort
    state.sort = sortSelect?.value || state.sort;

    updateToggleUI();

    // apply
    const filtered = applyFilters(all);
    view = applySort(filtered);
    renderProducts();
  }

  // ---------------------------
  // Chips
  // ---------------------------
  function renderChips() {
    if (!activeChips || !btnClearAll) return;

    const chips = [];

    if (state.q) chips.push({ key: 'q', label: `Search: "${state.q}"` });
    for (const g of state.genders) chips.push({ key: `gender:${g}`, label: `Gender: ${capitalize(g)}` });
    for (const b of state.brands) chips.push({ key: `brand:${b}`, label: `Brand: ${b}` });
    if (state.minPrice != null) chips.push({ key: 'minPrice', label: `Min: ${state.minPrice}` });
    if (state.maxPrice != null) chips.push({ key: 'maxPrice', label: `Max: ${state.maxPrice}` });
    if (state.minRating && Number(state.minRating) > 0) chips.push({ key: 'minRating', label: `Rating: ${state.minRating}+` });
    for (const c of state.colors) chips.push({ key: `color:${c}`, label: `Color: ${capitalize(c)}` });
    for (const s of state.styles) chips.push({ key: `style:${s}`, label: `Style: ${capitalize(s)}` });
    if (state.onlyPopular) chips.push({ key: 'onlyPopular', label: 'Popular' });
    if (state.onlyOffer) chips.push({ key: 'onlyOffer', label: 'Offer' });

    activeChips.innerHTML = chips.map(ch => `
      <button type="button" data-chip="${escapeHtml(ch.key)}"
        class="px-3 py-2 rounded-2xl bg-slate-900 text-white text-xs font-semibold hover:opacity-90">
        ${escapeHtml(ch.label)} <span class="opacity-70">×</span>
      </button>
    `).join('');

    btnClearAll.classList.toggle('hidden', chips.length === 0);

    activeChips.querySelectorAll('[data-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeChip(btn.dataset.chip);
        applyAndRender();
      });
    });
  }

  function removeChip(key) {
    if (key === 'q') { state.q = ''; if (qInput) qInput.value = ''; return; }
    if (key === 'minPrice') { state.minPrice = null; if (priceMin) priceMin.value = ''; return; }
    if (key === 'maxPrice') { state.maxPrice = null; if (priceMax) priceMax.value = ''; return; }
    if (key === 'minRating') { state.minRating = 0; return; }
    if (key === 'onlyPopular') { state.onlyPopular = false; return; }
    if (key === 'onlyOffer') { state.onlyOffer = false; return; }

    const [type, value] = String(key).split(':');

    if (type === 'gender') {
      state.genders.delete(value);
      genderChks.forEach(chk => { if (chk.value === value) chk.checked = false; });
    }
    if (type === 'brand') {
      state.brands.delete(value);
      brandList?.querySelectorAll('.brandChk')?.forEach(chk => { if (chk.value === value) chk.checked = false; });
    }
    if (type === 'color') state.colors.delete(value);
    if (type === 'style') state.styles.delete(value);
  }

  function resetAll() {
    state.q = '';
    state.genders.clear();
    state.brands.clear();
    state.minPrice = null;
    state.maxPrice = null;
    state.minRating = 0;
    state.colors.clear();
    state.styles.clear();
    state.onlyPopular = false;
    state.onlyOffer = false;

    if (qInput) qInput.value = '';
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';

    genderChks.forEach(chk => chk.checked = false);
    brandList?.querySelectorAll('.brandChk')?.forEach(chk => chk.checked = false);

    updateToggleUI();
    applyAndRender();
  }

  // ---------------------------
  // Bind UI
  // ---------------------------
  function bindRatingButtons() {
    document.querySelectorAll('.rateBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.minRating = Number(btn.dataset.minrate || 0);
        applyAndRender();
      });
    });
  }

  function bindToggleButtons() {
    togglePopular?.addEventListener('click', () => {
      state.onlyPopular = !state.onlyPopular;
      applyAndRender();
    });
    toggleOffer?.addEventListener('click', () => {
      state.onlyOffer = !state.onlyOffer;
      applyAndRender();
    });
  }

  function bindPrice() {
    btnPriceReset?.addEventListener('click', (e) => {
      e.preventDefault();
      if (priceMin) priceMin.value = '';
      if (priceMax) priceMax.value = '';
      state.minPrice = null;
      state.maxPrice = null;
      applyAndRender();
    });

    priceMin?.addEventListener('input', () => applyAndRender());
    priceMax?.addEventListener('input', () => applyAndRender());
  }

  function bindSearch() {
    qInput?.addEventListener('input', () => applyAndRender());
  }

  function bindGender() {
    genderChks.forEach(chk => chk.addEventListener('change', () => applyAndRender()));
  }

  function bindSort() {
    sortSelect?.addEventListener('change', () => applyAndRender());
  }

  function bindLoadMore() {
    btnLoadMore?.addEventListener('click', () => {
      page += 1;
      renderProducts();
    });
  }

  function bindClearAll() {
    btnClearAll?.addEventListener('click', resetAll);
    btnNoResultsReset?.addEventListener('click', resetAll);
  }

  btnApplyFilters?.addEventListener('click', () => {
    applyAndRender();
    closeFiltersDrawer();
  });

  // -------------------------
  // Mobile filters drawer (MOVE real filters card)
  // -------------------------
  let filtersOriginalParent = null;
  let filtersOriginalNext = null;

  function openFiltersDrawerReal() {
    if (!filtersBackdrop || !filtersDrawer || !filtersDrawerInner || !filtersCard) return;

    if (!filtersOriginalParent) {
      filtersOriginalParent = filtersCard.parentElement;
      filtersOriginalNext = filtersCard.nextElementSibling;
    }

    filtersDrawerInner.innerHTML = '';
    filtersDrawerInner.appendChild(filtersCard);

    filtersBackdrop.classList.remove('hidden');
    filtersDrawer.style.transform = 'translateX(0)';
  }

  function closeFiltersDrawer() {
    if (!filtersBackdrop || !filtersDrawer || !filtersCard) return;

    filtersBackdrop.classList.add('hidden');
    filtersDrawer.style.transform = 'translateX(-100%)';

    if (filtersOriginalParent) {
      if (filtersOriginalNext) filtersOriginalParent.insertBefore(filtersCard, filtersOriginalNext);
      else filtersOriginalParent.appendChild(filtersCard);
    }
  }

  function bindMobileFilters() {
    btnOpenFilters?.addEventListener('click', openFiltersDrawerReal);
    filtersBackdrop?.addEventListener('click', closeFiltersDrawer);

    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'btnCloseFilters') closeFiltersDrawer();
    });
  }

  // -------------------------
  // Init
  // -------------------------
  (async function init() {
    await loadData();
    parseParams();

    buildBrandUI();
    buildColorUI();
    buildStyleUI();

    bindRatingButtons();
    bindToggleButtons();
    bindPrice();
    bindSearch();
    bindGender();
    bindSort();
    bindLoadMore();
    bindClearAll();
    bindMobileFilters();

    applyAndRender();

    // Quick color clicks (event delegation)
    if (productGrid) {
      productGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-quick-color]');
        if (!btn) return;
        const c = btn.dataset.quickColor;
        if (state.colors.has(c)) state.colors.delete(c);
        else state.colors.add(c);
        applyAndRender();
      });
    }
  })();

})();