/* assets/js/contact.js
   - Search panel open/close
   - Contact form validation + toast
*/
(function () {
  const $ = (id) => document.getElementById(id);

  // Search panel
  const btnSearch = $('btnSearch');
  const searchPanel = $('searchPanel');
  const btnSearchClose = $('btnSearchClose');
  const searchInput = $('searchInput');

  btnSearch?.addEventListener('click', () => {
    searchPanel?.classList.toggle('hidden');
    if (searchPanel && !searchPanel.classList.contains('hidden')) {
      setTimeout(() => searchInput?.focus(), 50);
    }
  });
  btnSearchClose?.addEventListener('click', () => searchPanel?.classList.add('hidden'));

  // Toast
  const toast = $('toast');
  const toastClose = $('toastClose');
  function showToast() {
    toast?.classList.remove('hidden');
    setTimeout(() => toast?.classList.add('hidden'), 3500);
  }
  toastClose?.addEventListener('click', () => toast?.classList.add('hidden'));

  // Form
  const form = $('contactForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = ($('cName')?.value || '').trim();
    const email = ($('cEmail')?.value || '').trim();
    const subject = ($('cSubject')?.value || '').trim();
    const msg = ($('cMessage')?.value || '').trim();

    if (!name || name.length < 2) return alert('Please enter your name.');
    if (!email || !email.includes('@')) return alert('Please enter valid email.');
    if (!subject || subject.length < 3) return alert('Please enter subject.');
    if (!msg || msg.length < 5) return alert('Please enter message.');

    // Demo submit success
    form.reset();
    showToast();
  });
})();