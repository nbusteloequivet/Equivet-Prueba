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

  // Cuenta: si había una sesión guardada de una visita anterior, se
  // recupera acá sin volver a pedir email/contraseña. No se valida
  // contra el servidor en este momento — si el token ya venció, recién
  // se nota la próxima vez que se use de verdad (Fase E, "Mis pedidos").
  session = loadSessionFromStorage();
  updateAccountButton();
  setupAccountModal();

  loadCatalog();
  setInterval(loadCatalog, CONFIG.AUTO_REFRESH_MS);
});
