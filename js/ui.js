function setupSearch() {
  let debounceTimer;
  els.searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const value = e.target.value;
    debounceTimer = setTimeout(() => {
      searchTerm = value.trim().toLowerCase();
      renderGrid();
    }, 200);
  });
}

function buildCategoryChips() {
  const categories = [...new Set(allProducts.flatMap((p) => p.categories))].sort();
  categoryColorMap = {};
  categories.forEach((c, i) => (categoryColorMap[c] = CATEGORY_COLORS[i % CATEGORY_COLORS.length]));

  els.categoryChips.innerHTML = "";
  els.categoryChips.appendChild(makeChip("Todas", activeCategories.size === 0, () => {
    activeCategories.clear();
    buildCategoryChips();
    updateSubcategoryChips();
    renderGrid();
  }));
  categories.forEach((c) => els.categoryChips.appendChild(makeChip(c, activeCategories.has(c), () => {
    if (activeCategories.has(c)) activeCategories.delete(c); else activeCategories.add(c);
    buildCategoryChips();
    updateSubcategoryChips();
    renderGrid();
  })));
}

// Solo muestra el panel de subcategorías cuando hay EXACTAMENTE una
// categoría tildada — con 0 o 2+ categorías, "subcategorías de cuál?" es
// ambiguo, así que el panel se oculta.
function updateSubcategoryChips() {
  if (activeCategories.size !== 1) {
    activeSubcategory = null;
    els.subcategoryChips.innerHTML = "";
    setChipsPanelOpen(els.subcategoryChipsWrap, false);
    return;
  }

  const [category] = activeCategories;
  const subcats = [...new Set(allProducts.filter((p) => p.categories.includes(category)).flatMap((p) => p.subcategories))].sort();

  if (subcats.length === 0) {
    activeSubcategory = null;
    els.subcategoryChips.innerHTML = "";
    setChipsPanelOpen(els.subcategoryChipsWrap, false);
    return;
  }

  if (activeSubcategory && !subcats.includes(activeSubcategory)) {
    activeSubcategory = null;
  }

  renderSubcategoryChips(subcats);
  setChipsPanelOpen(els.subcategoryChipsWrap, true);
}

function renderSubcategoryChips(subcats) {
  els.subcategoryChips.innerHTML = "";
  els.subcategoryChips.appendChild(makeChip("Todas", activeSubcategory === null, () => {
    activeSubcategory = null;
    renderSubcategoryChips(subcats);
    renderGrid();
  }));
  subcats.forEach((s) => els.subcategoryChips.appendChild(makeChip(s, activeSubcategory === s, () => {
    activeSubcategory = s;
    renderSubcategoryChips(subcats);
    renderGrid();
  })));
}

function buildLabChips() {
  const labs = [...new Set(allProducts.map((p) => p.lab).filter(Boolean))].sort();

  els.labChips.innerHTML = "";
  els.labChips.appendChild(makeChip("Todos", activeLabs.size === 0, () => {
    activeLabs.clear();
    buildLabChips();
    renderGrid();
  }));
  labs.forEach((l) => els.labChips.appendChild(makeChip(l, activeLabs.has(l), () => {
    if (activeLabs.has(l)) activeLabs.delete(l); else activeLabs.add(l);
    buildLabChips();
    renderGrid();
  })));
}

function makeChip(label, isActive, onClick) {
  const chip = document.createElement("button");
  chip.className = "chip" + (isActive ? " active" : "");
  chip.textContent = label;
  chip.type = "button";
  chip.addEventListener("click", onClick);
  return chip;
}

/* ------------------------------------------------------------------------
   Paneles desplegables — ahora se animan 100% con CSS (ver
   .chips-panel-wrap en style.css, técnica de CSS Grid 0fr -> 1fr). Acá
   solo hace falta agregar/sacar una clase, nada de medir alturas a mano
   ni de coordinar rAF/setTimeout — por eso ya no queda "trabado".
   ------------------------------------------------------------------------ */
function setChipsPanelOpen(wrapEl, open) {
  wrapEl.classList.toggle("open", open);
}

function setupFilterToggles() {
  setupFilterToggle(els.categoryToggle, els.categoryChipsWrap);
  setupFilterToggle(els.labToggle, els.labChipsWrap);

  els.categoryToggle.addEventListener("click", () => {
    if (els.categoryToggle.getAttribute("aria-expanded") !== "true") {
      setChipsPanelOpen(els.subcategoryChipsWrap, false);
    }
  });
}

function setupFilterToggle(toggleBtn, wrapEl) {
  toggleBtn.addEventListener("click", () => {
    const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", String(!isOpen));
    setChipsPanelOpen(wrapEl, !isOpen);
  });
}

/* ------------------------------------------------------------------------
   "Cómo solicitar tu presupuesto" — mismo mecanismo que los paneles de
   arriba (CSS Grid, ver .how-to-use-panel-wrap): togglear aria-expanded
   alcanza, el CSS hace el resto solo.
   ------------------------------------------------------------------------ */
function setupHowToUseAnimation() {
  if (!els.howToUseToggle) return;
  els.howToUseToggle.addEventListener("click", () => {
    const isOpen = els.howToUseToggle.getAttribute("aria-expanded") === "true";
    els.howToUseToggle.setAttribute("aria-expanded", String(!isOpen));
  });
}

function renderGrid() {
  const filtered = allProducts.filter((p) => {
    if (activeCategories.size > 0 && !p.categories.some((c) => activeCategories.has(c))) return false;
    if (activeSubcategory && !p.subcategories.includes(activeSubcategory)) return false;
    if (activeLabs.size > 0 && !activeLabs.has(p.lab)) return false;
    if (searchTerm) {
      const haystack = `${p.name} ${p.categories.join(" ")} ${p.subcategories.join(" ")} ${p.code} ${p.lab}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }
    return true;
  });

  els.grid.innerHTML = "";
  cartIndicatorEls = {};
  addButtonEls = {};

  if (filtered.length === 0) {
    els.emptyState.hidden = false;
    return;
  }
  els.emptyState.hidden = true;

  const fragment = document.createDocumentFragment();
  filtered.forEach((p) => fragment.appendChild(buildCard(p)));
  els.grid.appendChild(fragment);
}

function availabilityTagHtml(p) {
  if (!p.availability) return "";
  const cls = p.availability === "En stock" ? "in" : "out";
  return `<span class="avail-tag ${cls}">${escapeHtml(p.availability)}</span>`;
}

function buildCard(p) {
  const key = productKey(p);

  const card = document.createElement("article");
  card.className = "product-card";

  const strip = document.createElement("div");
  strip.className = "card-strip";
  strip.style.background = categoryColorMap[p.categories[0]] || CATEGORY_COLORS[0];
  card.appendChild(strip);

  const availHtml = availabilityTagHtml(p);
  if (availHtml) {
    const badge = document.createElement("div");
    badge.className = "card-avail-badge";
    badge.innerHTML = availHtml;
    card.appendChild(badge);
  }

  const media = document.createElement("div");
  media.className = "card-media";
  media.appendChild(buildImageEl(p, false));
  media.addEventListener("click", () => openProductModal(p));
  card.appendChild(media);

  const body = document.createElement("div");
  body.className = "card-body";
  const showLab = Boolean(p.lab) && duplicateProductNames.has(normalizeNameForCompare(p.name));

  const categoryHtml = p.categories.map((c) => `<span class="card-category">${escapeHtml(c)}</span>`).join("");
  const subcategoryHtml = p.subcategories.map((s) => `<span class="card-subcategory">${escapeHtml(s)}</span>`).join("");

  body.innerHTML = `
    <h3 class="card-title">${escapeHtml(p.name)}</h3>
    ${categoryHtml}
    ${subcategoryHtml}
    <span class="card-lab">${showLab ? escapeHtml(p.lab) : ""}</span>
    <div class="card-bottom"></div>
  `;
  body.querySelector(".card-title").addEventListener("click", () => openProductModal(p));

  const cartRow = buildCartRow(p, key);
  body.querySelector(".card-bottom").appendChild(cartRow.wrapper);
  card.appendChild(body);

  cartIndicatorEls[key] = cartRow.indicatorEl;
  updateCartIndicator(key);

  return card;
}

function setAddButtonIdle(btn, key) {
  btn.classList.remove("is-done");
  btn.textContent = cart[key] ? "Modificar" : "Agregar";
}

function setAddButtonDone(btn, wasInCart) {
  btn.classList.add("is-done");
  btn.textContent = wasInCart ? "Modificado" : "Agregado";
}

function resetAddButton(key) {
  const btn = addButtonEls[key];
  if (!btn) return;
  setAddButtonIdle(btn, key);
}

function buildCartRow(p, key) {
  const wrapper = document.createElement("div");
  wrapper.className = "card-cart-row";

  const qtyControl = document.createElement("div");
  qtyControl.className = "qty-control";

  const minusBtn = document.createElement("button");
  minusBtn.type = "button";
  minusBtn.className = "qty-btn";
  minusBtn.textContent = "−";
  minusBtn.setAttribute("aria-label", "Restar uno");

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.className = "qty-input";
  qtyInput.min = "0";
  qtyInput.value = "1";
  qtyInput.setAttribute("aria-label", `Cantidad de ${p.name}`);

  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = "qty-btn";
  plusBtn.textContent = "+";
  plusBtn.setAttribute("aria-label", "Sumar uno");

  const stopBubble = (fn) => (e) => { e.stopPropagation(); fn(e); };

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-btn";
  setAddButtonIdle(addBtn, key);

  const onQtyChanged = () => {
    if (addBtn.classList.contains("is-done")) setAddButtonIdle(addBtn, key);
  };

  minusBtn.addEventListener("click", stopBubble(() => {
    qtyInput.value = Math.max(0, safeInt(qtyInput.value) - 1);
    onQtyChanged();
  }));
  plusBtn.addEventListener("click", stopBubble(() => {
    qtyInput.value = safeInt(qtyInput.value) + 1;
    onQtyChanged();
  }));
  qtyInput.addEventListener("click", (e) => e.stopPropagation());
  qtyInput.addEventListener("input", onQtyChanged);

  qtyControl.append(minusBtn, qtyInput, plusBtn);

  addBtn.addEventListener("click", stopBubble(() => {
    const qty = safeInt(qtyInput.value);
    if (qty <= 0) {
      removeFromCart(key);
    } else {
      const wasInCart = Boolean(cart[key]);
      addToCart(p, key, qty);
      setAddButtonDone(addBtn, wasInCart);
    }
  }));

  wrapper.append(qtyControl, addBtn);
  addButtonEls[key] = addBtn;

  const indicatorEl = document.createElement("div");
  indicatorEl.className = "cart-indicator";
  indicatorEl.hidden = true;

  const outer = document.createElement("div");
  outer.appendChild(wrapper);
  outer.appendChild(indicatorEl);

  return { wrapper: outer, indicatorEl };
}

function buildImageEl(p, large) {
  if (!p.imageUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "no-image";
    placeholder.textContent = "Sin imagen";
    return placeholder;
  }
  const img = document.createElement("img");
  img.src = p.imageUrl;
  img.alt = p.name;
  img.loading = large ? "eager" : "lazy";
  img.onerror = () => {
    img.replaceWith(Object.assign(document.createElement("div"), {
      className: "no-image",
      textContent: "Imagen no disponible",
    }));
  };
  return img;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function openProductModal(p) {
  const key = productKey(p);
  els.modalBody.innerHTML = "";

  const media = document.createElement("div");
  media.className = "modal-media";
  media.appendChild(buildImageEl(p, true));

  const info = document.createElement("div");
  info.className = "modal-info";
  const modalCategoryHtml = p.categories.map((c) => `<span class="modal-category">${escapeHtml(c)}</span>`).join("");
  const modalSubcategoryHtml = p.subcategories.map((s) => `<span class="modal-subcategory">${escapeHtml(s)}</span>`).join("");
  info.innerHTML = `
    <h2 id="modal-title">${escapeHtml(p.name)}</h2>
    <div class="modal-tags">${modalCategoryHtml}${modalSubcategoryHtml}</div>
    <div class="modal-avail-row">${availabilityTagHtml(p)}</div>
    ${p.lab ? `<div class="modal-row"><span class="k">Laboratorio</span><span>${escapeHtml(p.lab)}</span></div>` : ""}
    ${p.description ? `<p class="modal-desc">${escapeHtml(p.description)}</p>` : ""}
  `;

  const cartRow = buildCartRow(p, key);
  cartRow.wrapper.querySelector(".card-cart-row").classList.add("modal-cart-row");
  info.appendChild(cartRow.wrapper);

  els.modalBody.appendChild(media);
  els.modalBody.appendChild(info);

  cartIndicatorEls[key] = cartRow.indicatorEl;
  updateCartIndicator(key);

  openModalEl(els.productModal);
}

function openModalEl(modalEl) {
  modalEl.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModalEl(modalEl) {
  modalEl.hidden = true;
  if (els.productModal.hidden && els.cartModal.hidden) {
    document.body.style.overflow = "";
  }
  if (modalEl === els.productModal) renderGrid();
}

function setupModalClosers() {
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModalEl(document.getElementById(btn.dataset.closeModal)));
  });
  [els.productModal, els.cartModal, els.accountModal, els.historialModal].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModalEl(overlay);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!els.cartModal.hidden) closeModalEl(els.cartModal);
    else if (!els.historialModal.hidden) closeModalEl(els.historialModal);
    else if (!els.accountModal.hidden) closeModalEl(els.accountModal);
    else if (!els.productModal.hidden) closeModalEl(els.productModal);
  });
}

function setupCartModal() {
  els.cartFab.addEventListener("click", () => {
    renderCartModal();
    openModalEl(els.cartModal);
    autoGrowTextarea(els.cartMensaje);
  });

  els.clearCartBtn.addEventListener("click", () => {
    clearCart();
    showCartStatus("Vaciaste tu pedido.", "success");
  });

  els.sendOrderBtn.addEventListener("click", sendOrder);
}

function renderCartModal() {
  const items = Object.entries(cart);
  els.cartItemsEl.innerHTML = "";
  els.cartEmptyEl.hidden = items.length > 0;

  items.forEach(([key, entry]) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    const metaText = entry.product.subcategories.length
      ? entry.product.subcategories.join(", ")
      : entry.product.categories.join(", ");
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(entry.product.name)}</div>
        <div class="cart-item-meta">${escapeHtml(metaText)}</div>
      </div>
    `;

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "0";
    qtyInput.className = "cart-item-qty";
    qtyInput.value = String(entry.qty);
    qtyInput.setAttribute("aria-label", `Cantidad de ${entry.product.name}`);
    qtyInput.addEventListener("change", () => {
      const qty = safeInt(qtyInput.value);
      if (qty <= 0) {
        removeFromCart(key);
      } else {
        entry.qty = qty;
        updateCartIndicator(key);
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-item-remove";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", `Quitar ${entry.product.name}`);
    removeBtn.addEventListener("click", () => removeFromCart(key));

    row.appendChild(qtyInput);
    row.appendChild(removeBtn);
    els.cartItemsEl.appendChild(row);
  });
}

function showCartStatus(msg, type) {
  els.cartStatus.hidden = false;
  els.cartStatus.textContent = msg;
  els.cartStatus.className = "cart-status " + type;
}
function hideCartStatus() {
  els.cartStatus.hidden = true;
}

function autoGrowTextarea(textareaEl) {
  textareaEl.style.height = "auto";
  textareaEl.style.height = textareaEl.scrollHeight + "px";
}

function setupAutoGrowTextarea(textareaEl) {
  textareaEl.addEventListener("input", () => autoGrowTextarea(textareaEl));
}

function setupContactFab() {
  els.contactFab.addEventListener("click", () => {
    els.contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setupCompanyContact() {
  els.contactInstagram.href = CONFIG.COMPANY_INSTAGRAM_URL;
  els.contactInstagramValue.textContent = CONFIG.COMPANY_INSTAGRAM_HANDLE;

  els.contactWhatsapp.href = `https://wa.me/${CONFIG.COMPANY_WHATSAPP_NUMBER}`;
  els.contactWhatsappValue.textContent = CONFIG.COMPANY_WHATSAPP_DISPLAY;

  els.contactGmail.href = "#";
  els.contactGmail.addEventListener("click", (e) => {
    e.preventDefault();
    openEmailContact(CONFIG.COMPANY_EMAIL, "", "");
  });
  els.contactGmailValue.textContent = CONFIG.COMPANY_EMAIL;

  els.contactHoursValue.textContent = CONFIG.COMPANY_HOURS;

  els.contactAddressValue.textContent = CONFIG.COMPANY_ADDRESS;
  const encodedQuery = encodeURIComponent(CONFIG.COMPANY_MAP_QUERY);
  els.contactMapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  els.contactMapIframe.src = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;
}

function showStatus(msg, type) {
  els.statusBanner.hidden = false;
  els.statusBanner.textContent = msg;
  els.statusBanner.className = "status-banner" + (type === "info" ? " info" : "");
}
function hideStatus() {
  els.statusBanner.hidden = true;
}

function showAccountStatus(el, msg, type) {
  el.hidden = false;
  el.textContent = msg;
  el.className = "cart-status " + type;
}
function hideAccountStatus(el) {
  el.hidden = true;
}

const ACCOUNT_VIEWS = {
  login: { el: () => els.accountViewLogin, title: "Iniciar sesión" },
  registro: { el: () => els.accountViewRegistro, title: "Crear cuenta" },
  forgot: { el: () => els.accountViewForgot, title: "Recuperar contraseña" },
  reset: { el: () => els.accountViewReset, title: "Nueva contraseña" },
  verificar: { el: () => els.accountViewVerificar, title: "Revisá tu correo" },
  logged: { el: () => els.accountViewLogged, title: "Mi cuenta" },
};

function showAccountView(viewName) {
  Object.values(ACCOUNT_VIEWS).forEach((v) => { v.el().hidden = true; });
  const view = ACCOUNT_VIEWS[viewName];
  view.el().hidden = false;
  els.accountTitle.textContent = view.title;
}

function showAccountLoggedView() {
  els.accountGreetingName.textContent = session.nombre || "";
  showAccountView("logged");
  updateAccountButton();
}

function updateAccountButton() {
  els.accountFab.textContent = session ? `Hola, ${session.nombre}` : "Iniciar sesión";
}

function setupAccountModal() {
  els.accountFab.addEventListener("click", () => {
    if (session) {
      els.accountGreetingName.textContent = session.nombre || "";
      showAccountView("logged");
    } else {
      showAccountView("login");
    }
    openModalEl(els.accountModal);
  });

  els.showRegistroBtn.addEventListener("click", () => showAccountView("registro"));
  els.showLoginBtn.addEventListener("click", () => showAccountView("login"));
  els.showForgotBtn.addEventListener("click", () => showAccountView("forgot"));
  els.showLoginFromForgotBtn.addEventListener("click", () => showAccountView("login"));

  els.loginSubmitBtn.addEventListener("click", submitLogin);
  els.registroSubmitBtn.addEventListener("click", submitRegistro);
  els.forgotSubmitBtn.addEventListener("click", submitForgotPassword);
  els.resetSubmitBtn.addEventListener("click", submitResetPassword);
  els.accountLogoutBtn.addEventListener("click", logout);

  const conectarEnter = (input, submitFn) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitFn();
      }
    });
  };
  [els.loginEmail, els.loginPassword].forEach((input) => conectarEnter(input, submitLogin));
  [els.registroNombre, els.registroApellido, els.registroEmail, els.registroPassword].forEach((input) => conectarEnter(input, submitRegistro));
  conectarEnter(els.forgotEmail, submitForgotPassword);
  conectarEnter(els.resetPassword, submitResetPassword);
}

const HISTORIAL_VIEWS = {
  list: () => els.historialViewList,
  detail: () => els.historialViewDetail,
  guest: () => els.historialViewGuest,
};

function showHistorialView(viewName) {
  Object.values(HISTORIAL_VIEWS).forEach((getEl) => { getEl().hidden = true; });
  HISTORIAL_VIEWS[viewName]().hidden = false;
}

async function openHistorialModal() {
  if (!session) {
    showHistorialView("guest");
    openModalEl(els.historialModal);
    return;
  }

  showHistorialView("list");
  els.historialEmpty.hidden = true;
  els.historialList.innerHTML = "<p class=\"cart-empty\">Cargando…</p>";
  openModalEl(els.historialModal);

  const data = await fetchMisPedidos();
  if (!data.ok) {
    els.historialList.innerHTML = "";
    els.historialEmpty.hidden = false;
    els.historialEmpty.textContent = "No pudimos cargar tu historial — cerrá este cartel y volvé a intentar.";
    return;
  }
  els.historialEmpty.textContent = "Todavía no hiciste ningún pedido.";
  renderHistorialList(data.pedidos);
}

function setupHistorialModal() {
  els.historialFab.addEventListener("click", openHistorialModal);
  els.historialBackBtn.addEventListener("click", () => showHistorialView("list"));

  els.historialGuestLoginBtn.addEventListener("click", () => {
    closeModalEl(els.historialModal);
    showAccountView("login");
    openModalEl(els.accountModal);
  });

  els.historialEditBtn.addEventListener("click", () => {
    const noEncontrados = cargarPedidoEnCarrito(currentHistorialPedido);
    closeModalEl(els.historialModal);
    renderCartModal();
    openModalEl(els.cartModal);
    autoGrowTextarea(els.cartMensaje);

    if (noEncontrados.length > 0) {
      showCartStatus(
        `Cargamos tu pedido — ojo, ${noEncontrados.length} producto(s) de esa vez ya no están en el catálogo actual (quedaron anotados en el mensaje).`,
        "error"
      );
    } else {
      showCartStatus("Cargamos tu pedido anterior — modificá lo que necesites y reenvialo.", "success");
    }
  });
}
