/* =========================================================================
   MAIN.JS — Punto de arranque.
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  cacheElements();

  els.labSub.textContent = CONFIG.LAB_SUBTITLE;
  els.logoImg.src = CONFIG.LOGO_PATH;
  els.loadingBanner.hidden = !CONFIG.SHOW_LOADING_BANNER;

  setupSearch();
  setupFilterToggles();
  setupModalClosers();
  setupCartModal();
  setupAutoGrowTextarea(els.cartMensaje);
  setupContactFab();
  setupCompanyContact();

  session = loadSessionFromStorage();
  updateAccountButton();
  setupAccountModal();
  setupHistorialModal();

  loadCatalog();
  setInterval(loadCatalog, CONFIG.AUTO_REFRESH_MS);
});
