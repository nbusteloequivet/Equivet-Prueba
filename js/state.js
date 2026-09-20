/* =========================================================================
   STATE.JS — Estado compartido en memoria de toda la aplicación.
   ========================================================================= */

let allProducts = [];

// Categorías y laboratorios activos: ahora son conjuntos (Set), no un
// solo valor — permite tener varias categorías o varios laboratorios
// tildados al mismo tiempo (filtro "OR" dentro de cada tipo).
let activeCategories = new Set();
let activeLabs = new Set();
let activeSubcategory = null;
let searchTerm = "";

let categoryColorMap = {};

let duplicateProductNames = new Set();

let cart = {};

let cartIndicatorEls = {};

let addButtonEls = {};

let session = null;

let editingOrderId = null;

const els = {};

function cacheElements() {
  els.grid = document.getElementById("catalog-grid");
  els.statusBanner = document.getElementById("status-banner");
  els.emptyState = document.getElementById("empty-state");
  els.searchInput = document.getElementById("search-input");
  els.categoryChips = document.getElementById("category-chips");
  els.subcategoryChips = document.getElementById("subcategory-chips");
  els.labChips = document.getElementById("lab-chips");
  els.categoryToggle = document.getElementById("category-toggle");
  els.labToggle = document.getElementById("lab-toggle");
  els.labName = document.getElementById("lab-name");
  els.labSub = document.getElementById("lab-sub");
  els.logoImg = document.getElementById("brand-logo");
  els.loadingBanner = document.getElementById("loading-products-banner");

  els.productModal = document.getElementById("product-modal");
  els.modalBody = document.getElementById("modal-body");

  els.cartFab = document.getElementById("cart-fab");
  els.cartModal = document.getElementById("cart-modal");
  els.cartTitle = document.getElementById("cart-title");
  els.cartItemsEl = document.getElementById("cart-items");
  els.cartEmptyEl = document.getElementById("cart-empty");
  els.cartNombre = document.getElementById("cart-nombre");
  els.cartApellido = document.getElementById("cart-apellido");
  els.cartEntidad = document.getElementById("cart-entidad");
  els.cartWhatsapp = document.getElementById("cart-whatsapp");
  els.cartEmail = document.getElementById("cart-email");
  els.cartMensaje = document.getElementById("cart-mensaje");
  els.cartHoneypot = document.getElementById("cart-honeypot");
  els.cartStatus = document.getElementById("cart-status");
  els.clearCartBtn = document.getElementById("clear-cart-btn");

  els.sendOrderBtn = document.getElementById("send-order-btn");

  els.contactFab = document.getElementById("contact-fab");
  els.contactSection = document.getElementById("company-contact");

  els.contactInstagram = document.getElementById("contact-instagram");
  els.contactInstagramValue = document.getElementById("contact-instagram-value");
  els.contactWhatsapp = document.getElementById("contact-whatsapp");
  els.contactWhatsappValue = document.getElementById("contact-whatsapp-value");
  els.contactGmail = document.getElementById("contact-gmail");
  els.contactGmailValue = document.getElementById("contact-gmail-value");
  els.contactHoursValue = document.getElementById("contact-hours-value");
  els.contactAddressValue = document.getElementById("contact-address-value");
  els.contactMapLink = document.getElementById("contact-map-link");
  els.contactMapIframe = document.getElementById("contact-map-iframe");

  els.accountFab = document.getElementById("account-fab");
  els.accountModal = document.getElementById("account-modal");
  els.accountTitle = document.getElementById("account-title");

  els.accountViewLogin = document.getElementById("account-view-login");
  els.accountViewRegistro = document.getElementById("account-view-registro");
  els.accountViewVerificar = document.getElementById("account-view-verificar");
  els.accountViewLogged = document.getElementById("account-view-logged");

  els.loginEmail = document.getElementById("login-email");
  els.loginPassword = document.getElementById("login-password");
  els.loginStatus = document.getElementById("login-status");
  els.loginSubmitBtn = document.getElementById("login-submit-btn");
  els.showRegistroBtn = document.getElementById("show-registro-btn");

  els.registroNombre = document.getElementById("registro-nombre");
  els.registroApellido = document.getElementById("registro-apellido");
  els.registroEmail = document.getElementById("registro-email");
  els.registroPassword = document.getElementById("registro-password");
  els.registroStatus = document.getElementById("registro-status");
  els.registroSubmitBtn = document.getElementById("registro-submit-btn");
  els.showLoginBtn = document.getElementById("show-login-btn");

  els.accountGreetingName = document.getElementById("account-greeting-name");
  els.accountLogoutBtn = document.getElementById("account-logout-btn");

  els.historialFab = document.getElementById("historial-fab");
  els.historialModal = document.getElementById("historial-modal");
  els.historialList = document.getElementById("historial-list");
  els.historialEmpty = document.getElementById("historial-empty");
  els.historialViewList = document.getElementById("historial-view-list");
  els.historialViewDetail = document.getElementById("historial-view-detail");
  els.historialViewGuest = document.getElementById("historial-view-guest");
  els.historialGuestLoginBtn = document.getElementById("historial-guest-login-btn");
  els.historialBackBtn = document.getElementById("historial-back-btn");
  els.historialDetailBody = document.getElementById("historial-detail-body");
  els.historialEditBtn = document.getElementById("historial-edit-btn");
  els.historialEditStatus = document.getElementById("historial-edit-status");
}
