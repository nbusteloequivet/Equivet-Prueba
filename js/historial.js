let currentHistorialPedido = null;

async function fetchMisPedidos() {
  if (!session) return { ok: false, pedidos: [] };
  try {
    return await accountApiCall({ action: "misPedidos", token: session.token });
  } catch (err) {
    console.error("Error al traer el historial:", err);
    return { ok: false, pedidos: [] };
  }
}

function formatFechaHora(fecha, hora) {
  const horaCorta = (hora || "").toString().split(":").slice(0, 2).join(":");
  return [fecha, horaCorta].filter(Boolean).join(" · ");
}

function buildHistorialCard(pedido) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "historial-card";
  card.innerHTML = `
    <span class="historial-card-date">Pedido #${escapeHtml(String(pedido.orderId))} — ${escapeHtml(formatFechaHora(pedido.fecha, pedido.hora))}</span>
    <span class="historial-card-arrow" aria-hidden="true">→</span>
  `;
  card.addEventListener("click", () => openHistorialDetail(pedido));
  return card;
}

function renderHistorialList(pedidos) {
  els.historialList.innerHTML = "";
  els.historialEmpty.hidden = pedidos.length > 0;
  pedidos.forEach((pedido) => els.historialList.appendChild(buildHistorialCard(pedido)));
}

function historialDetailRowHtml(label, value) {
  if (!value) return "";
  return `<div class="historial-detail-row"><span class="k">${escapeHtml(label)}</span><span>${escapeHtml(String(value))}</span></div>`;
}

function renderHistorialDetail(pedido) {
  const nombreCompleto = [pedido.nombre, pedido.apellido].filter(Boolean).join(" ");
  const itemsHtml = pedido.items.length
    ? pedido.items.map((item) => `
        <div class="historial-item-row">
          <span>${escapeHtml(item.nombre)}</span>
          <span>Cantidad: ${escapeHtml(String(item.cantidad))}</span>
        </div>
      `).join("")
    : `<p class="cart-empty">Este pedido no tiene productos del catálogo cargados.</p>`;

  const mensajeHtml = pedido.mensaje
    ? `<div class="historial-mensaje-block">
         <span class="historial-mensaje-label">Mensaje adicional</span>
         <p class="historial-mensaje">"${escapeHtml(pedido.mensaje)}"</p>
       </div>`
    : "";

  els.historialDetailBody.innerHTML = `
    ${historialDetailRowHtml("Pedido", "#" + pedido.orderId + " — " + formatFechaHora(pedido.fecha, pedido.hora))}
    ${historialDetailRowHtml("Cliente", nombreCompleto)}
    ${historialDetailRowHtml("Entidad", pedido.entidad)}
    ${historialDetailRowHtml("Necesita factura", pedido.necesitaFactura ? "Sí" : "No")}
    ${historialDetailRowHtml("WhatsApp", pedido.whatsapp)}
    ${historialDetailRowHtml("Email", pedido.email)}
    <div class="historial-items-list">${itemsHtml}</div>
    ${mensajeHtml}
  `;
}

function openHistorialDetail(pedido) {
  currentHistorialPedido = pedido;
  els.historialEditStatus.hidden = true;
  renderHistorialDetail(pedido);
  showHistorialView("detail");
}

function normalizarCodigo(codigo) {
  return String(codigo == null ? "" : codigo).trim().replace(/^0+(?=\d)/, "");
}

function cargarPedidoEnCarrito(pedido) {
  clearCart();

  const noEncontrados = [];
  pedido.items.forEach((item) => {
    const match = allProducts.find((p) => {
      if (item.codigo && p.code) return normalizarCodigo(item.codigo) === normalizarCodigo(p.code);
      return !item.codigo && p.name === item.nombre;
    });
    if (match) {
      const key = productKey(match);
      cart[key] = { product: match, qty: safeInt(item.cantidad) || 1 };
    } else {
      noEncontrados.push(item);
    }
  });

  els.cartNombre.value = pedido.nombre || "";
  els.cartApellido.value = pedido.apellido || "";
  els.cartEntidad.value = pedido.entidad || "";
  els.cartFactura.checked = Boolean(pedido.necesitaFactura);
  els.cartWhatsapp.value = pedido.whatsapp || "";
  els.cartEmail.value = pedido.email || "";

  let mensaje = pedido.mensaje || "";
  if (noEncontrados.length > 0) {
    const aviso = "Productos de este pedido que ya no están en el catálogo actual: " +
      noEncontrados.map((i) => `${i.nombre} (cantidad ${i.cantidad})`).join(", ");
    mensaje = mensaje ? mensaje + "\n\n" + aviso : aviso;
  }
  els.cartMensaje.value = mensaje;

  editingOrderId = pedido.orderId;
  els.cartTitle.textContent = "Editando pedido #" + pedido.orderId;
  els.sendOrderBtn.textContent = "Editar y enviar pedido";

  Object.keys(cart).forEach((key) => {
    updateCartIndicator(key);
    const btn = addButtonEls[key];
    if (btn) setAddButtonDone(btn, false);
  });

  return noEncontrados;
}
