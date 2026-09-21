document.addEventListener("DOMContentLoaded", () => {
  cacheElements();

  els.labSub.textContent = CONFIG.LAB_SUBTITLE;
  els.logoImg.src = CONFIG.LOGO_PATH;
  els.loadingBanner.hidden = !CONFIG.SHOW_LOADING_BANNER;

  setupSearch();
  setupFilterToggles();
  setupHowToUseAnimation();
  setupModalClosers();
  setupCartModal();
  setupAutoGrowTextarea(els.cartMensaje);
  setupContactFab();
  setupCompanyContact();

  session = loadSessionFromStorage();
  updateAccountButton();
  if (session) autocompletarDatosCliente();
  setupAccountModal();
  setupHistorialModal();

  // Si llegó desde el link del mail de "contraseña olvidada"
  // (?resetToken=...), abre directo el modal de cuenta en la vista de
  // "elegir nueva contraseña" — ver detectarResetTokenEnURL en account.js.
  if (detectarResetTokenEnURL()) {
    showAccountView("reset");
    openModalEl(els.accountModal);
  }

  loadCatalog();
  setInterval(loadCatalog, CONFIG.AUTO_REFRESH_MS);
});
