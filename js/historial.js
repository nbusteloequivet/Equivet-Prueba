/* =========================================================================
   HISTORIAL.JS — Trae el historial de pedidos del cliente logueado desde
   Código.gs y arma el HTML de la lista de tarjetas y del detalle de cada
   pedido. No decide CUÁNDO se muestra cada cosa (eso es setupHistorialModal
   en ui.js) — solo trae los datos y los convierte en HTML.
   ========================================================================= */

// Pedido actualmente abierto en la vista de detalle — se guarda acá para
// que, cuando se conecte "Editar pedido" (próxima fase), ya se sepa sobre
// cuál pedido trabajar sin volver a consultar el servidor.
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

// "15/09/2026" + "10:27:40" -> "15/09/2026 · 10:27" (sin segundos).
function formatFechaHora(fecha, hora) {
  const horaCorta = (hora || "").toString().split(":").slice(0, 2).join(":");
  return [fecha, horaCorta].filter(Boolean).join(" · ");
}

function buildHistorialCard(pedido) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "historial-card";
  card.innerHTML = `
    <span class="historial-card-date">${escapeHtml(formatFechaHora(pedido.fecha, pedido.hora))}</span>
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

  els.historialDetailBody.innerHTML = `
    ${historialDetailRowHtml("Pedido", "#" + pedido.orderId + " — " + formatFechaHora(pedido.fecha, pedido.hora))}
    ${historialDetailRowHtml("Cliente", nombreCompleto)}
    ${historialDetailRowHtml("Entidad", pedido.entidad)}
    ${historialDetailRowHtml("WhatsApp", pedido.whatsapp)}
    ${historialDetailRowHtml("Email", pedido.email)}
    <div class="historial-items-list">${itemsHtml}</div>
    ${pedido.mensaje ? `<p class="historial-mensaje">"${escapeHtml(pedido.mensaje)}"</p>` : ""}
  `;
}

function openHistorialDetail(pedido) {
  currentHistorialPedido = pedido;
  els.historialEditStatus.hidden = true;
  renderHistorialDetail(pedido);
  showHistorialView("detail");
}
