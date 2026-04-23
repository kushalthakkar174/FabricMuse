/* assets/js/auth.js
   Demo auth using localStorage:
   - fm_user: { id, name, email }
   - fm_token: string
*/

(function () {
  const $ = (id) => document.getElementById(id);

  const tabLogin = $('tabLogin');
  const tabRegister = $('tabRegister');

  const loginForm = $('loginForm');
  const registerForm = $('registerForm');

  const authAlert = $('authAlert');
  const authHint = $('authHint');

  const alreadyBox = $('alreadyBox');
  const alreadyText = $('alreadyText');
  const btnContinue = $('btnContinue');
  const btnLogoutHere = $('btnLogoutHere');

  const toggleLoginPass = $('toggleLoginPass');
  const toggleRegPass = $('toggleRegPass');

  function getRedirect() {
    const url = new URL(window.location.href);
    return url.searchParams.get('redirect') || 'index.html';
  }

  function setContinueLink() {
    const r = getRedirect();
    if (btnContinue) btnContinue.href = r;
    if (authHint) authHint.textContent = `After login, we will redirect you to: ${r}`;
  }

  function showAlert(type, msg) {
    if (!authAlert) return;
    authAlert.classList.remove('hidden');
    authAlert.className = 'mb-4 rounded-2xl border p-4 text-sm';

    if (type === 'success') authAlert.classList.add('border-teal-300', 'bg-teal-50', 'text-slate-900');
    if (type === 'error') authAlert.classList.add('border-rose-300', 'bg-rose-50', 'text-slate-900');
    if (type === 'info') authAlert.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-900');

    authAlert.textContent = msg;
  }

  function hideAlert() {
    if (!authAlert) return;
    authAlert.classList.add('hidden');
  }

  function setTab(mode) {
    hideAlert();

    if (mode === 'login') {
      tabLogin.className = 'flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:opacity-90 transition';
      tabRegister.className = 'flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold transition';
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      tabRegister.className = 'flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:opacity-90 transition';
      tabLogin.className = 'flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold transition';
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
  }

  function isLoggedIn() {
    return !!localStorage.getItem('fm_token') && !!localStorage.getItem('fm_user');
  }

  function safeJSON(v) {
    try { return JSON.parse(v); } catch { return null; }
  }

  function loginAs(user) {
    const token = 'fm_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('fm_user', JSON.stringify(user));
    localStorage.setItem('fm_token', token);
    // let navbar update if app.js listens
    window.dispatchEvent(new Event('fm:auth-changed'));
  }

  function logout() {
    localStorage.removeItem('fm_user');
    localStorage.removeItem('fm_token');
    window.dispatchEvent(new Event('fm:auth-changed'));
  }

  function goNext() {
    const r = getRedirect();
    window.location.href = r;
  }

  // Toggle password visibility
  function bindToggle(btn, inputId) {
    const input = $(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.innerHTML = isPass ? "<i class='bx bx-hide text-xl'></i>" : "<i class='bx bx-show text-xl'></i>";
    });
  }

  bindToggle(toggleLoginPass, 'loginPass');
  bindToggle(toggleRegPass, 'regPass');

  // Tabs
  tabLogin?.addEventListener('click', () => setTab('login'));
  tabRegister?.addEventListener('click', () => setTab('register'));

  // Forgot demo
  $('btnForgot')?.addEventListener('click', () => {
    showAlert('info', 'Demo: password reset is not connected. Just login with any password (min 4 chars).');
  });

  // Forms
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert();

    const email = ($('loginEmail')?.value || '').trim().toLowerCase();
    const pass = ($('loginPass')?.value || '').trim();

    if (!email || !email.includes('@')) return showAlert('error', 'Enter a valid email.');
    if (pass.length < 4) return showAlert('error', 'Password must be at least 4 characters (demo).');

    const nameFromEmail = email.split('@')[0].replaceAll('.', ' ');
    const user = {
      id: 'u_' + Math.random().toString(36).slice(2, 8),
      name: nameFromEmail ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) : 'User',
      email
    };

    loginAs(user);
    showAlert('success', 'Login successful ✅ Redirecting...');
    setTimeout(goNext, 650);
  });

  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert();

    const first = ($('regFirst')?.value || '').trim();
    const last = ($('regLast')?.value || '').trim();
    const email = ($('regEmail')?.value || '').trim().toLowerCase();
    const p1 = ($('regPass')?.value || '').trim();
    const p2 = ($('regPass2')?.value || '').trim();
    const agree = !!$('agree')?.checked;

    if (!first || !last) return showAlert('error', 'Enter first name and last name.');
    if (!email || !email.includes('@')) return showAlert('error', 'Enter a valid email.');
    if (p1.length < 4) return showAlert('error', 'Password must be at least 4 characters.');
    if (p1 !== p2) return showAlert('error', 'Passwords do not match.');
    if (!agree) return showAlert('error', 'Please accept Terms & Privacy.');

    const user = {
      id: 'u_' + Math.random().toString(36).slice(2, 8),
      name: `${first} ${last}`,
      email
    };

    loginAs(user);
    showAlert('success', 'Account created ✅ Redirecting...');
    setTimeout(goNext, 650);
  });

  // Already logged in UI
  function renderAlready() {
    if (!alreadyBox) return;
    const user = safeJSON(localStorage.getItem('fm_user') || '');

    if (isLoggedIn() && user) {
      alreadyBox.classList.remove('hidden');
      if (alreadyText) alreadyText.textContent = `Welcome back, ${user.name} (${user.email})`;
      // keep forms visible but user sees this box too (nice UX)
    } else {
      alreadyBox.classList.add('hidden');
    }
  }

  btnLogoutHere?.addEventListener('click', () => {
    logout();
    showAlert('info', 'Logged out. You can login again.');
    renderAlready();
  });

  // Init
  setContinueLink();
  setTab('login');

  // If URL has ?mode=register
  const url = new URL(window.location.href);
  if ((url.searchParams.get('mode') || '').toLowerCase() === 'register') setTab('register');

  renderAlready();
})();