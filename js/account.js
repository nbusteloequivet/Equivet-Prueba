/* =========================================================================
   ACCOUNT.JS — Login, registro y sesión del cliente.
   ========================================================================= */

const SESSION_STORAGE_KEY = "equivetSession";

function loadSessionFromStorage() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("No se pudo leer la sesión guardada:", err);
    return null;
  }
}

function saveSessionToStorage(sessionData) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.warn("No se pudo guardar la sesión:", err);
  }
}

function clearSessionFromStorage() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn("No se pudo borrar la sesión:", err);
  }
}

async function accountApiCall(params) {
  const url = new URL(CONFIG.ORDERS_SHEET_WEBAPP_URL);
  url.searchParams.set("siteToken", CONFIG.SITE_TOKEN);
  Object.keys(params).forEach((key) => url.searchParams.set(key, params[key]));

  const response = await fetch(url.toString());
  return response.json();
}

// Completa Nombre/Apellido/Email del formulario de pedido con los datos
// de la cuenta logueada. WhatsApp y Entidad NO se tocan — no forman
// parte de la cuenta (nunca se piden al registrarse), pueden variar de
// un pedido a otro.
function autocompletarDatosCliente() {
  if (!session) return;
  els.cartNombre.value = session.nombre || "";
  els.cartApellido.value = session.apellido || "";
  els.cartEmail.value = session.email || "";
}

async function submitLogin() {
  hideAccountStatus(els.loginStatus);

  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;

  if (!email || !password) {
    showAccountStatus(els.loginStatus, "Completá email y contraseña.", "error");
    return;
  }

  els.loginSubmitBtn.disabled = true;
  try {
    const data = await accountApiCall({ action: "login", email, password });

    if (!data.ok) {
      showAccountStatus(els.loginStatus, mensajeErrorCuenta(data.error), "error");
      return;
    }

    session = { token: data.token, nombre: data.nombre, apellido: data.apellido, email: data.email };
    saveSessionToStorage(session);
    autocompletarDatosCliente();
    els.loginEmail.value = "";
    els.loginPassword.value = "";
    showAccountLoggedView();
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    showAccountStatus(els.loginStatus, "No pudimos conectar — probá de nuevo en un momento.", "error");
  } finally {
    els.loginSubmitBtn.disabled = false;
  }
}

async function submitRegistro() {
  hideAccountStatus(els.registroStatus);

  const nombre = els.registroNombre.value.trim();
  const apellido = els.registroApellido.value.trim();
  const email = els.registroEmail.value.trim();
  const password = els.registroPassword.value;

  if (!nombre || !apellido || !email || !password) {
    showAccountStatus(els.registroStatus, "Completá nombre, apellido, email y contraseña.", "error");
    return;
  }
  if (password.length < 8) {
    showAccountStatus(els.registroStatus, "La contraseña tiene que tener al menos 8 caracteres.", "error");
    return;
  }

  els.registroSubmitBtn.disabled = true;
  try {
    const data = await accountApiCall({ action: "registrar", nombre, apellido, email, password });

    if (!data.ok) {
      showAccountStatus(els.registroStatus, mensajeErrorCuenta(data.error), "error");
      return;
    }

    els.registroNombre.value = "";
    els.registroApellido.value = "";
    els.registroEmail.value = "";
    els.registroPassword.value = "";
    showAccountView("verificar");
  } catch (err) {
    console.error("Error al registrarse:", err);
    showAccountStatus(els.registroStatus, "No pudimos conectar — probá de nuevo en un momento.", "error");
  } finally {
    els.registroSubmitBtn.disabled = false;
  }
}

function logout() {
  session = null;
  clearSessionFromStorage();
  showAccountView("login");
  updateAccountButton();
}

function mensajeErrorCuenta(codigo) {
  const mensajes = {
    email_invalido: "El email no parece válido.",
    password_muy_corta: "La contraseña tiene que tener al menos 8 caracteres.",
    email_ya_registrado: "Ya existe una cuenta verificada con ese email.",
    credenciales_invalidas: "Email o contraseña incorrectos.",
    cuenta_no_verificada: "Todavía no verificaste tu cuenta — revisá tu mail.",
  };
  return mensajes[codigo] || "Ocurrió un error — probá de nuevo.";
}
