/* assets/js/app.js
   Global app logic for ALL pages:
   - Theme (dark mode)
   - Mobile menu drawer
   - Search panel (redirect to products.html?q=...)
   - Profile dropdown + demo auth state (localStorage)
   - Cart drawer + persistent cart (localStorage)
*/

(function () {
  // ---------------------------
  // Helpers
  // ---------------------------
  const $ = (id) => document.getElementById(id);

  function safeJSONParse(value, fallback) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function formatMoney(n) {
    return `$${Number(n || 0).toFixed(2)}`;
  }

  // ---------------------------
  // AUTH (SINGLE SOURCE OF TRUTH)
  // auth.js should set: fm_user + fm_token
  // ---------------------------
  const AUTH = {
    getUser() {
      return safeJSONParse(localStorage.getItem('fm_user'), null);
    },
    isLoggedIn() {
      return !!localStorage.getItem('fm_token') && !!localStorage.getItem('fm_user');
    },
    logout() {
      localStorage.removeItem('fm_user');
      localStorage.removeItem('fm_token');
      window.dispatchEvent(new Event('fm:auth-changed'));
    },
    require(redirectTo) {
      if (this.isLoggedIn()) return true;
      const r = redirectTo || window.location.pathname.split('/').pop() || 'index.html';
      window.location.href = `auth.html?redirect=${encodeURIComponent(r)}`;
      return false;
    }
  };
  window.FM_AUTH = AUTH;

  // ---------------------------
  // THEME (Dark mode)
  // ---------------------------
  const root = document.documentElement;
  const btnTheme = $('btnTheme');
  const btnThemeMobile = $('btnThemeMobile');
  const iconTheme = $('iconTheme');

  function setTheme(mode) {
    if (mode === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (iconTheme) iconTheme.className = 'bx bx-sun text-2xl';
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (iconTheme) iconTheme.className = 'bx bx-moon text-2xl';
    }
  }

  // Prefer saved theme; fallback to system preference; then light
  (function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return setTheme(saved);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  })();

  function toggleTheme() {
    const isDark = root.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  }

  btnTheme?.addEventListener('click', toggleTheme);
  btnThemeMobile?.addEventListener('click', toggleTheme);

  // ---------------------------
  // MOBILE MENU
  // ---------------------------
  const btnMobileMenu = $('btnMobileMenu');
  const btnMobileClose = $('btnMobileClose');
  const mobileMenuBackdrop = $('mobileMenuBackdrop');
  const mobileMenu = $('mobileMenu');

  function lockScroll(lock) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function openMobileMenu() {
    if (!mobileMenu || !mobileMenuBackdrop) return;

    lockScroll(true);
    mobileMenuBackdrop.classList.remove('hidden');

    // IMPORTANT: remove tailwind translate class
    mobileMenu.classList.remove('-translate-x-full');
    mobileMenu.classList.add('drawer-open');
    mobileMenu.style.transform = 'translateX(0)';
  }

  function closeMobileMenu() {
    if (!mobileMenu || !mobileMenuBackdrop) return;

    lockScroll(false);
    mobileMenuBackdrop.classList.add('hidden');

    mobileMenu.classList.remove('drawer-open');
    mobileMenu.classList.add('-translate-x-full');
    mobileMenu.style.transform = 'translateX(-100%)';
  }

  btnMobileMenu?.addEventListener('click', openMobileMenu);
  btnMobileClose?.addEventListener('click', closeMobileMenu);
  mobileMenuBackdrop?.addEventListener('click', closeMobileMenu);
  mobileMenu?.querySelectorAll('a')?.forEach(a => a.addEventListener('click', closeMobileMenu));

  // ---------------------------
  // SEARCH PANEL (redirect to products)
  // NOTE: works ONLY if page has searchPanel HTML ids
  // ---------------------------
  const btnSearch = $('btnSearch');
  const searchPanel = $('searchPanel');
  const btnSearchClose = $('btnSearchClose');
  const btnSearchGo = $('btnSearchGo');
  const searchInput = $('searchInput');

  function openSearch() {
    if (!searchPanel) return;
    searchPanel.classList.remove('hidden');
    setTimeout(() => searchInput?.focus(), 60);
  }

  function closeSearch() {
    searchPanel?.classList.add('hidden');
  }

  function goSearch() {
    const q = (searchInput?.value || '').trim();
    const url = q ? `products.html?q=${encodeURIComponent(q)}` : 'products.html';
    window.location.href = url;
  }

  btnSearch?.addEventListener('click', () => {
    if (!searchPanel) return;
    const isHidden = searchPanel.classList.contains('hidden');
    if (isHidden) openSearch(); else closeSearch();
  });

  btnSearchClose?.addEventListener('click', closeSearch);
  btnSearchGo?.addEventListener('click', goSearch);

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goSearch();
    if (e.key === 'Escape') closeSearch();
  });

  // ---------------------------
  // PROFILE DROPDOWN (auth aware)
  // ---------------------------
  const btnProfile = $('btnProfile');
  const profileMenu = $('profileMenu');
  const btnLogout = $('btnLogout');

  const profileHello = $('profileHello');
  const profileSub = $('profileSub');
  const profilePrimaryLink = $('profilePrimaryLink');
  const profileOrdersLink = $('profileOrdersLink');
  const mobileAuthLink = $('mobileAuthLink');

  function renderProfileUI() {
    if (!profileHello || !profileSub || !profilePrimaryLink) return;

    if (AUTH.isLoggedIn()) {
      const user = AUTH.getUser() || { name: 'User', email: '' };
      profileHello.textContent = `Hi, ${user.name} 👋`;
      profileSub.textContent = user.email ? user.email : 'Signed in';

      profilePrimaryLink.textContent = 'My Account (Demo)';
      profilePrimaryLink.href = 'products.html';

      profileOrdersLink?.classList.remove('hidden');
      btnLogout?.classList.remove('hidden');

      if (mobileAuthLink) {
        mobileAuthLink.textContent = 'My Account (Demo)';
        mobileAuthLink.href = 'products.html';
      }
    } else {
      profileHello.textContent = 'Welcome 👋';
      profileSub.textContent = 'Sign in to track orders';

      profilePrimaryLink.textContent = 'Login / Register';
      profilePrimaryLink.href = 'auth.html';

      profileOrdersLink?.classList.add('hidden');
      btnLogout?.classList.add('hidden');

      if (mobileAuthLink) {
        mobileAuthLink.textContent = 'Login / Register';
        mobileAuthLink.href = 'auth.html';
      }
    }
  }

  renderProfileUI();
  window.addEventListener('fm:auth-changed', renderProfileUI);

  btnProfile?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu?.classList.toggle('hidden');
    // close search if open (nicer UX)
    closeSearch();
  });

  // Close profile menu if clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btnProfile') && !e.target.closest('#profileMenu')) {
      profileMenu?.classList.add('hidden');
    }
  });

  btnLogout?.addEventListener('click', () => {
    AUTH.logout();
    profileMenu?.classList.add('hidden');
    alert('Logged out ✅');
  });

  // ---------------------------
  // CART (persist across pages)
  // Stored as: fm_cart = [{id,title,price,img,qty}]
  // ---------------------------
  const btnCart = $('btnCart');
  const btnCartClose = $('btnCartClose');
  const cartBackdrop = $('cartBackdrop');
  const cartDrawer = $('cartDrawer');
  const cartBadge = $('cartBadge');

  const cartEmpty = $('cartEmpty');
  const cartItemsEl = $('cartItems');
  const cartSubtotalEl = $('cartSubtotal');
  const btnCheckout = $('btnCheckout');

  function getCart() {
    const parsed = safeJSONParse(localStorage.getItem('fm_cart'), []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function setCart(cart) {
    localStorage.setItem('fm_cart', JSON.stringify(cart));
    renderCart();
    // broadcast for products page / badges etc
    window.dispatchEvent(new Event('fm:cart-changed'));
  }

  function cartCount(cart) {
    return cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function calcSubtotal(cart) {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  }

  function openCart() {
    if (!cartBackdrop || !cartDrawer) return;

    renderCart();
    lockScroll(true);
    cartBackdrop.classList.remove('hidden');

    // IMPORTANT: remove tailwind translate class
    cartDrawer.classList.remove('translate-x-full');
    cartDrawer.classList.add('drawer-open');
    cartDrawer.style.transform = 'translateX(0)';
  }

  function closeCart() {
    if (!cartBackdrop || !cartDrawer) return;

    lockScroll(false);
    cartBackdrop.classList.add('hidden');

    cartDrawer.classList.remove('drawer-open');
    cartDrawer.classList.add('translate-x-full');
    cartDrawer.style.transform = 'translateX(100%)';
  }

  btnCart?.addEventListener('click', () => {
    // close profile if open
    profileMenu?.classList.add('hidden');
    // close search if open
    closeSearch();
    openCart();
  });

  btnCartClose?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);

  // ESC to close overlays (cart, mobile menu, search, profile)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCart();
    closeMobileMenu();
    closeSearch();
    profileMenu?.classList.add('hidden');
  });

  function updateBadge() {
    const cart = getCart();
    const count = cartCount(cart);
    if (!cartBadge) return;

    if (count > 0) {
      cartBadge.textContent = String(count);
      cartBadge.classList.remove('hidden');
    } else {
      cartBadge.classList.add('hidden');
    }
  }

  function changeQty(productId, delta) {
    const cart = getCart();
    const item = cart.find(x => x.id === productId);
    if (!item) return;

    item.qty = (Number(item.qty) || 1) + delta;
    const next = item.qty <= 0 ? cart.filter(x => x.id !== productId) : cart;
    setCart(next);
  }

  function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
      cartEmpty?.classList.remove('hidden');
      cartItemsEl?.classList.add('hidden');
    } else {
      cartEmpty?.classList.add('hidden');
      cartItemsEl?.classList.remove('hidden');
    }

    if (cartItemsEl) {
      cartItemsEl.innerHTML = cart.map(item => `
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-3 flex gap-3">
          <img src="${item.img || 'fashion/f1.jpg'}" alt="${item.title || 'Product'}" class="h-20 w-20 rounded-2xl object-cover" />
          <div class="flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-semibold">${item.title || 'Product'}</p>
                <p class="text-xs opacity-70 mt-1">${formatMoney(item.price)} • Qty ${item.qty}</p>
              </div>
              <button data-remove="${item.id}" class="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-950" aria-label="Remove">
                <i class='bx bx-trash text-xl'></i>
              </button>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <div class="inline-flex items-center rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button data-dec="${item.id}" class="px-3 py-2 hover:bg-white dark:hover:bg-slate-950">-</button>
                <span class="px-4 py-2 text-sm font-semibold">${item.qty}</span>
                <button data-inc="${item.id}" class="px-3 py-2 hover:bg-white dark:hover:bg-slate-950">+</button>
              </div>
              <p class="font-semibold">${formatMoney((Number(item.price) || 0) * (Number(item.qty) || 0))}</p>
            </div>
          </div>
        </div>
      `).join('');

      cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-remove');
          setCart(getCart().filter(x => x.id !== id));
        });
      });

      cartItemsEl.querySelectorAll('[data-dec]').forEach(btn => {
        btn.addEventListener('click', () => changeQty(btn.getAttribute('data-dec'), -1));
      });

      cartItemsEl.querySelectorAll('[data-inc]').forEach(btn => {
        btn.addEventListener('click', () => changeQty(btn.getAttribute('data-inc'), 1));
      });
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(calcSubtotal(cart));
    updateBadge();
  }

  // Public helper for products page:
  // window.FM_CART.add({id,title,price,img})
  window.FM_CART = {
    add(product) {
      if (!product || !product.id) return;
      const cart = getCart();
      const exists = cart.find(x => x.id === product.id);
      if (exists) exists.qty = (Number(exists.qty) || 1) + 1;
      else cart.push({ ...product, qty: 1 });
      setCart(cart);
    },
    open: openCart,
    close: closeCart,
    get: getCart,
    set: setCart
  };

  // Checkout: REQUIRE LOGIN first
  btnCheckout?.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) return alert('Your cart is empty.');

    if (!AUTH.isLoggedIn()) {
      AUTH.require(window.location.pathname.split('/').pop() || 'index.html');
      return;
    }

    setCart([]);
    closeCart();
    alert('Thank you for your purchase :) (Demo checkout)');
  });

  // init cart ui
  renderCart();

  // ---------------------------
  // Newsletter demo
  // ---------------------------
  const btnNewsletter = $('btnNewsletter');
  btnNewsletter?.addEventListener('click', () => {
    const input = $('newsletterEmail');
    const email = (input?.value || '').trim();
    if (!email) return alert('Please enter your email.');
    alert('Subscribed (demo) ✅');
    if (input) input.value = '';
  });
})();