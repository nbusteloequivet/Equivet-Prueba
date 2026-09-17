/* =========================================================================
   ACCOUNT.JS — Login, registro y sesión del cliente.

   La sesión (token + nombre + apellido) se guarda en localStorage del
   navegador, así el cliente no tiene que loguearse de nuevo cada vez que
   entra al sitio. La contraseña NUNCA se guarda acá — solo persiste el
   token que devuelve Código.gs al loguearse.

   Login y registro van por GET (no por POST): es la única forma de poder
   LEER la respuesta desde el navegador — ver la explicación completa en
   el chat de cuando se armó esto. El envío de pedidos (cart.js) sigue
   siendo POST con no-cors, eso no cambia.
   ========================================================================= */

const SESSION_STORAGE_KEY = "equivetSession";

/* ------------------------------------------------------------------------
   Persistencia de la sesión en el navegador
   ------------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------------
   Llamada genérica a las acciones de cuenta del Apps Script (todas GET).
   Arma la URL con el siteToken siempre incluido, y devuelve el JSON ya
   interpretado.
   ------------------------------------------------------------------------ */
async function accountApiCall(params) {
  const url = new URL(CONFIG.ORDERS_SHEET_WEBAPP_URL);
  url.searchParams.set("siteToken", CONFIG.SITE_TOKEN);
  Object.keys(params).forEach((key) => url.searchParams.set(key, params[key]));

  const response = await fetch(url.toString());
  return response.json();
}

/* ------------------------------------------------------------------------
   Login
   ------------------------------------------------------------------------ */
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

    session = { token: data.token, nombre: data.nombre, apellido: data.apellido };
    saveSessionToStorage(session);
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

/* ------------------------------------------------------------------------
   Registro
   ------------------------------------------------------------------------ */
async function submitRegistro() {
  hideAccountStatus(els.registroStatus);

  const nombre = els.registroNombre.value.trim();
  const apellido = els.registroApellido.value.trim();
  const email = els.registroEmail.value.trim();
  const password = els.registroPassword.value;

  if (!nombre || !email || !password) {
    showAccountStatus(els.registroStatus, "Completá nombre, email y contraseña.", "error");
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

/* ------------------------------------------------------------------------
   Logout — no hace falta avisarle al servidor, alcanza con borrar el
   token guardado acá.
   ------------------------------------------------------------------------ */
function logout() {
  session = null;
  clearSessionFromStorage();
  showAccountView("login");
  updateAccountButton();
}

/* ------------------------------------------------------------------------
   Traduce los códigos de error que devuelve Código.gs a texto legible
   para el cliente, sin exponer detalles internos.
   ------------------------------------------------------------------------ */
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
