/* assets/js/services.js
   - FAQ accordion
   - Return portal modal (3-step demo)
   - Requires login for return portal (redirect to auth)
*/
(function () {
  const $ = (id) => document.getElementById(id);

  // FAQ
  document.querySelectorAll('.faqItem').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.dataset.open === 'true';
      // close all
      document.querySelectorAll('.faqItem').forEach((x) => {
        x.dataset.open = 'false';
        x.querySelector('.faqAns')?.classList.add('hidden');
        const icon = x.querySelector('i.bx');
        if (icon) icon.className = 'bx bx-plus text-2xl opacity-70';
      });

      // toggle current
      if (!open) {
        btn.dataset.open = 'true';
        btn.querySelector('.faqAns')?.classList.remove('hidden');
        const icon = btn.querySelector('i.bx');
        if (icon) icon.className = 'bx bx-minus text-2xl opacity-70';
      }
    });
  });

  // Search panel (UI only on services page)
const btnSearch = document.getElementById('btnSearch');
const searchPanel = document.getElementById('searchPanel');
const btnSearchClose = document.getElementById('btnSearchClose');
const searchInput = document.getElementById('searchInput');

btnSearch?.addEventListener('click', () => {
  searchPanel?.classList.toggle('hidden');
  if (searchPanel && !searchPanel.classList.contains('hidden')) {
    setTimeout(() => searchInput?.focus(), 50);
  }
});
btnSearchClose?.addEventListener('click', () => searchPanel?.classList.add('hidden'));

  // Return portal modal
  const returnModal = $('returnModal');
  const btnOpenReturnPortal = $('btnOpenReturnPortal');
  const btnReturnClose = $('btnReturnClose');
  const btnReturnClose2 = $('btnReturnClose2');

  const step1 = $('returnStep1');
  const step2 = $('returnStep2');
  const step3 = $('returnStep3');

  const orderIdInput = $('returnOrderId');
  const btnNext1 = $('btnReturnNext1');

  const actionBtns = document.querySelectorAll('.returnAction');
  const reasonSelect = $('returnReason');
  const exchangeWrap = $('exchangeSizeWrap');
  const exchangeSize = $('exchangeSize');
  const btnNext2 = $('btnReturnNext2');

  const doneText = $('returnDoneText');

  let selectedAction = 'refund';

  function openModal() {
    if (!returnModal) return;
    returnModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!returnModal) return;
    returnModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function goto(step) {
    step1?.classList.add('hidden');
    step2?.classList.add('hidden');
    step3?.classList.add('hidden');
    if (step === 1) step1?.classList.remove('hidden');
    if (step === 2) step2?.classList.remove('hidden');
    if (step === 3) step3?.classList.remove('hidden');
  }

  function setActionUI() {
    actionBtns.forEach((b) => {
      const active = (b.dataset.action || '') === selectedAction;
      b.classList.toggle('bg-slate-900', active);
      b.classList.toggle('text-white', active);
    });
    if (exchangeWrap) exchangeWrap.classList.toggle('hidden', selectedAction !== 'exchange');
  }

  btnOpenReturnPortal?.addEventListener('click', () => {
    // Require login
    if (window.FM_AUTH && !window.FM_AUTH.isLoggedIn()) {
      // redirect back to services after login
      window.location.href = `auth.html?redirect=${encodeURIComponent('services.html')}`;
      return;
    }
    // reset
    if (orderIdInput) orderIdInput.value = '';
    selectedAction = 'refund';
    setActionUI();
    goto(1);
    openModal();
  });

  btnReturnClose?.addEventListener('click', closeModal);
  btnReturnClose2?.addEventListener('click', closeModal);

  // click outside card close
  returnModal?.addEventListener('click', (e) => {
    if (e.target === returnModal.querySelector('div.absolute')) closeModal();
  });

  btnNext1?.addEventListener('click', () => {
    const id = (orderIdInput?.value || '').trim();
    if (!id) return alert('Please enter Order ID.');
    goto(2);
  });

  actionBtns.forEach((b) => {
    b.addEventListener('click', () => {
      selectedAction = b.dataset.action || 'refund';
      setActionUI();
    });
  });

  btnNext2?.addEventListener('click', () => {
    const orderId = (orderIdInput?.value || '').trim() || 'FM-0000';
    const reason = reasonSelect?.value || 'size';
    const size = exchangeSize?.value || 'M';

    let msg = `Order ${orderId} — ${selectedAction.toUpperCase()} created. Reason: ${reason}.`;
    if (selectedAction === 'exchange') msg += ` New size: ${size}.`;
    msg += ' Pickup scheduled (demo).';

    if (doneText) doneText.textContent = msg;
    goto(3);
  });

  // Init
  setActionUI();
  
})();