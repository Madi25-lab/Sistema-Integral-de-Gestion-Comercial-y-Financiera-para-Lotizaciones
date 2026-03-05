// ═══════════════════════════════════════════════════════
//  InmoSistema — script.js  (Corregido + Completo)
//  Interfaz de usuario → llama a la API REST del servidor
// ═══════════════════════════════════════════════════════

const Estado = {
  usuario:      null,
  tipo:         null,
  clientes:     [],
  ventas:       [],
  toastTimer:   null,
  ventasCache:  [],
};

// ══════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════

const fmt = m => "S/ " + Number(m).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtFecha = f => {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtFechaCorta = f => {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const distribLabel = {
  ESQUINA: "Esquina", AVENIDA: "Avenida",
  PASAJE:  "Pasaje",  FRENTE_PARQUE: "Frente Parque"
};

function badgeLote(e) {
  const m = {
    DISPONIBLE:        ["badge-disponible", "Disponible"],
    RESERVADO:         ["badge-reservado",  "Reservado"],
    EN_FINANCIAMIENTO: ["badge-financiamiento", "Financiamiento"],
    VENDIDO:           ["badge-vendido",    "Vendido"],
  };
  const [c, l] = m[e] || ["", e];
  return `<span class="badge ${c}">${l}</span>`;
}

function badgeVenta(e) {
  const m = {
    ACTIVA:     ["badge-activa",     "Activa"],
    COMPLETADA: ["badge-completada", "Completada"],
    ANULADA:    ["badge-anulada",    "Anulada"],
  };
  const [c, l] = m[e] || ["", e];
  return `<span class="badge ${c}">${l}</span>`;
}

function badgeTipo(t) {
  return t === "CONTADO"
    ? `<span class="badge badge-contado">Contado</span>`
    : `<span class="badge badge-financiado">Financiado</span>`;
}

function toast(msg, tipo = "success") {
  const el = document.getElementById("toast");
  const icon = tipo === "success" ? "✓" : tipo === "warn" ? "⚠" : "✕";
  el.textContent = `${icon}  ${msg}`;
  el.className = `show ${tipo}`;
  clearTimeout(Estado.toastTimer);
  Estado.toastTimer = setTimeout(() => { el.className = ""; }, 4200);
}

function setAlert(id, msg, tipo = "error") {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = msg ? `<div class="alert alert-${tipo}">${msg}</div>` : "";
}

function limpiar(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function filtrarTabla(searchId, tbodyId) {
  const q = document.getElementById(searchId).value.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

function filtrarVentasJefe() {
  const filtro = document.getElementById("filter-estado-ventas").value;
  document.querySelectorAll("#todas-ventas-tbody tr").forEach(row => {
    row.style.display = (!filtro || (row.dataset.estado || "") === filtro) ? "" : "none";
  });
}

// ══════════════════════════════════════════════
//  LOGIN / LOGOUT
// ══════════════════════════════════════════════

async function handleLogin() {
  const usuario    = document.getElementById("login-usuario").value.trim();
  const contraseña = document.getElementById("login-contraseña").value;
  const errEl      = document.getElementById("login-error");
  errEl.textContent = "";

  if (!usuario || !contraseña) { errEl.textContent = "Completa todos los campos."; return; }

  try {
    const res  = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, contraseña }),
    });
    const data = await res.json();
    if (!data.exito) { errEl.textContent = data.mensaje; return; }
    Estado.usuario = data.usuario;
    Estado.tipo    = data.usuario.tipo;
    await iniciarApp();
  } catch {
    errEl.textContent = "Error de conexión con el servidor.";
  }
}

document.addEventListener("keydown", e => {
  const ls = document.getElementById("login-screen");
  if (e.key === "Enter" && ls && ls.style.display !== "none") handleLogin();
});

function handleLogout() {
  Estado.usuario = null; Estado.tipo = null;
  Estado.clientes = []; Estado.ventas = []; Estado.ventasCache = [];
  document.getElementById("app").style.display          = "none";
  document.getElementById("login-screen").style.display = "flex";
  limpiar("login-usuario", "login-contraseña");
  document.getElementById("login-error").textContent = "";
}

// ══════════════════════════════════════════════
//  INICIAR APP
// ══════════════════════════════════════════════

async function iniciarApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display          = "block";  // ← CORRECCIÓN: era "flex" pero el layout usa block

  document.getElementById("topbar-nombre").textContent = Estado.usuario.nombre;
  document.getElementById("user-avatar").textContent   = Estado.usuario.nombre.charAt(0).toUpperCase();
  const rolEl = document.getElementById("topbar-rol");
  rolEl.textContent = Estado.tipo === "JEFE" ? "Jefe de Ventas" : "Asesor";

  document.getElementById("nav-jefe").style.display   = Estado.tipo === "JEFE"   ? "block" : "none";
  document.getElementById("nav-asesor").style.display = Estado.tipo === "ASESOR" ? "block" : "none";

  if (Estado.tipo === "ASESOR") {
    await cargarClientesAsesor();
    await cargarVentasAsesor();
  }

  const dateEl = document.getElementById("dash-date");
  if (dateEl) dateEl.textContent =
    new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  navigate("dashboard");
}

// ══════════════════════════════════════════════
//  NAVEGACIÓN
// ══════════════════════════════════════════════

function navigate(viewId, navEl) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const view = document.getElementById("view-" + viewId);
  if (view) view.classList.add("active");

  if (navEl) navEl.classList.add("active");
  else {
    const m = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (m) m.classList.add("active");
  }

  const loaders = {
    "dashboard":       cargarDashboard,
    "lotes":           cargarLotes,
    "mis-clientes":    renderMisClientes,
    "nueva-venta":     prepararNuevaVenta,
    "mis-ventas":      renderMisVentas,
    "cuotas":          prepararCuotas,
    "asesores":        cargarAsesores,
    "gestionar-lotes": cargarGestionarLotes,
    "todas-ventas":    cargarTodasVentas,
    "reportes":        cargarReportes,
    "configuracion":   cargarConfiguracion,
  };
  if (loaders[viewId]) loaders[viewId]();
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) e.target.classList.remove("open");
});

// ══════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════

async function cargarDashboard() {
  const nombreEl = document.getElementById("dash-welcome");
  if (nombreEl) nombreEl.textContent = `Bienvenido de regreso, ${Estado.usuario.nombre}`;

  const lotes = await fetchLotes();
  const disp  = lotes.filter(l => l.estado === "DISPONIBLE");

  const contEl = document.getElementById("lotes-count");
  if (contEl) contEl.textContent = disp.length;

  if (Estado.tipo === "JEFE") await dashJefe(lotes);
  else                            dashAsesor(disp);

  document.getElementById("dash-lotes-table").innerHTML = disp.length === 0
    ? `<div class="empty-state"><div class="icon">◻</div><p>No hay lotes disponibles en este momento.</p></div>`
    : `<table><thead><tr><th>Nombre</th><th>Zona</th><th>Dist.</th><th>Precio</th></tr></thead><tbody>
        ${disp.slice(0, 6).map(l => `
          <tr>
            <td><strong>${l.nombre}</strong><div style="font-size:11px;color:var(--text3)">${l.tamanio} m²</div></td>
            <td><span class="badge badge-reservado">Zona ${l.zona}</span></td>
            <td style="color:var(--text2);font-size:12px">${distribLabel[l.tipoDistribucion] || l.tipoDistribucion}</td>
            <td style="color:var(--gold);font-weight:600">${fmt(l.precio)}</td>
          </tr>`).join("")}
       </tbody></table>`;
}

async function dashJefe(lotes) {
  const ventas   = await fetchTodasVentas();
  const ingresos = ventas.filter(v => v.estado === "COMPLETADA").reduce((s, v) => s + v.total, 0);
  const activas  = ventas.filter(v => v.estado === "ACTIVA").length;
  const complet  = ventas.filter(v => v.estado === "COMPLETADA").length;

  document.getElementById("dash-stats").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Lotes</div>
      <div class="stat-value">${lotes.length}</div>
      <div class="stat-sub">${lotes.filter(l => l.estado === "DISPONIBLE").length} disponibles</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ventas Activas</div>
      <div class="stat-value blue">${activas}</div>
      <div class="stat-sub">${lotes.filter(l => l.estado === "EN_FINANCIAMIENTO").length} en financiamiento</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ventas Completadas</div>
      <div class="stat-value green">${complet}</div>
      <div class="stat-sub">${lotes.filter(l => l.estado === "VENDIDO").length} lotes vendidos</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ingresos Confirmados</div>
      <div class="stat-value small">${fmt(ingresos)}</div>
      <div class="stat-sub">Ventas completadas</div>
    </div>`;

  document.getElementById("dash-extra-title").textContent = "Resumen Operacional";
  const anuladas = ventas.filter(v => v.estado === "ANULADA").length;
  document.getElementById("dash-extra-content").innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
      ${[
        ["Total ventas registradas", ventas.length, "var(--text)"],
        ["Ventas anuladas",          anuladas,       "var(--danger)"],
        ["Lotes reservados",         lotes.filter(l => l.estado === "RESERVADO").length, "var(--gold)"],
        ["Tasa de conversión",       ventas.length > 0 ? Math.round(complet / ventas.length * 100) + "%" : "—", "var(--success)"],
      ].map(([lbl, val, col]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:9px 0;border-bottom:1px solid var(--border)">
          <span style="color:var(--text2)">${lbl}</span>
          <strong style="color:${col}">${val}</strong>
        </div>`).join("")}
    </div>`;
}

function dashAsesor(disp) {
  const ventasActivas = Estado.ventas.filter(v => v.estado === "ACTIVA").length;
  const ventasComplet = Estado.ventas.filter(v => v.estado === "COMPLETADA").length;

  document.getElementById("dash-stats").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Mis Clientes</div>
      <div class="stat-value">${Estado.clientes.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ventas Activas</div>
      <div class="stat-value blue">${ventasActivas}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Completadas</div>
      <div class="stat-value green">${ventasComplet}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Lotes Disponibles</div>
      <div class="stat-value">${disp.length}</div>
    </div>`;

  document.getElementById("dash-extra-title").textContent = "Mis Ventas Recientes";
  const rec = [...Estado.ventas].reverse().slice(0, 5);
  document.getElementById("dash-extra-content").innerHTML = rec.length === 0
    ? `<p style="color:var(--text3);font-size:13px;padding:8px 0">Aún no tienes ventas registradas.<br>
       <a href="#" style="color:var(--gold)" onclick="navigate('nueva-venta')">Registrar primera venta →</a></p>`
    : rec.map(v => `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:9px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:500">${v.cliente?.nombre || "—"}</div>
            <div style="font-size:11px;color:var(--text3)">${v.lote?.nombre || "—"} · ${fmtFechaCorta(v.fecha)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${badgeTipo(v.tipo)}
            ${badgeVenta(v.estado)}
          </div>
        </div>`).join("");
}

// ══════════════════════════════════════════════
//  LOTES
// ══════════════════════════════════════════════

async function fetchLotes() {
  try { return await (await fetch("/api/lotes")).json(); } catch { return []; }
}

function renderTablaLotes(lotes, tbodyId) {
  document.getElementById(tbodyId).innerHTML = lotes.length === 0
    ? `<tr><td colspan="7"><div class="empty-state"><div class="icon">◻</div><p>Sin lotes registrados.</p></div></td></tr>`
    : lotes.map(l => `
        <tr>
          <td><code style="color:var(--text3);font-size:12px">#${l.id}</code></td>
          <td><strong>${l.nombre}</strong><div style="font-size:11px;color:var(--text3)">${l.ubicacion || ""}</div></td>
          <td>${l.tamanio} m²</td>
          <td><span class="badge badge-reservado">Zona ${l.zona}</span></td>
          <td style="color:var(--text2);font-size:12px">${distribLabel[l.tipoDistribucion] || l.tipoDistribucion}</td>
          <td style="color:var(--gold);font-weight:600">${fmt(l.precio)}</td>
          <td>${badgeLote(l.estado)}</td>
        </tr>`).join("");
}

async function cargarLotes()          { renderTablaLotes(await fetchLotes(), "lotes-tbody"); }
async function cargarGestionarLotes() { renderTablaLotes(await fetchLotes(), "gestionar-lotes-tbody"); }

// Preview precio al registrar lote
function previewLotePrecio() {
  const precio = parseFloat(document.getElementById("lt-precio").value);
  const prev   = document.getElementById("lt-precio-preview");
  if (isNaN(precio) || precio <= 0) { prev.classList.remove("visible"); return; }
  prev.classList.add("visible");
  prev.innerHTML = `💰 Precio: <strong style="color:var(--gold)">${fmt(precio)}</strong>
    · Cuota 12m: <strong style="color:var(--success)">${fmt(precio / 12)}</strong>
    · Cuota 24m: <strong style="color:var(--info)">${fmt(precio / 24)}</strong>`;
}

async function registrarLote() {
  const nombre  = document.getElementById("lt-nombre").value.trim();
  const tamanio = parseFloat(document.getElementById("lt-tamanio").value);
  const ubic    = document.getElementById("lt-ubicacion").value.trim();
  const zona    = document.getElementById("lt-zona").value;
  const dist    = document.getElementById("lt-distribucion").value;
  const precio  = parseFloat(document.getElementById("lt-precio").value);

  if (!nombre || !ubic || isNaN(tamanio) || tamanio <= 0 || isNaN(precio) || precio <= 0) {
    setAlert("modal-lote-alert", "Completa todos los campos. Tamaño y precio deben ser mayores a 0."); return;
  }
  try {
    const res  = await fetch("/api/lotes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jefeId: Estado.usuario.id, nombre, tamanio, ubicacion: ubic, zona, tipoDistribucion: dist, precio }),
    });
    const data = await res.json();
    if (!res.ok) { setAlert("modal-lote-alert", data.mensaje); return; }
    toast(`Lote "${nombre}" registrado correctamente.`);
    closeModal("modal-lote");
    limpiar("lt-nombre", "lt-tamanio", "lt-ubicacion", "lt-precio");
    setAlert("modal-lote-alert", "");
    document.getElementById("lt-precio-preview").classList.remove("visible");
    cargarGestionarLotes();
  } catch { setAlert("modal-lote-alert", "Error de conexión con el servidor."); }
}

// ══════════════════════════════════════════════
//  CLIENTES  (asesor)
// ══════════════════════════════════════════════

async function cargarClientesAsesor() {
  try {
    const res = await fetch(`/api/clientes?asesorId=${Estado.usuario.id}`);
    Estado.clientes = await res.json();
  } catch { Estado.clientes = []; }
}

function renderMisClientes() {
  document.getElementById("clientes-tbody").innerHTML = Estado.clientes.length === 0
    ? `<tr><td colspan="5"><div class="empty-state">
         <div class="icon">◯</div>
         <p>Sin clientes registrados.<br>Haz clic en <strong>+ Nuevo Cliente</strong> para agregar uno.</p>
       </div></td></tr>`
    : Estado.clientes.map(c => `
        <tr>
          <td><code style="color:var(--text3);font-size:12px">#${c.id}</code></td>
          <td><strong>${c.nombre}</strong></td>
          <td><code style="background:var(--surface);padding:2px 8px;border-radius:5px;font-size:12px">${c.dni}</code></td>
          <td>${c.telefono}</td>
          <td style="color:var(--text2)">${c.direccion}</td>
        </tr>`).join("");
}

async function registrarCliente() {
  const nombre    = document.getElementById("cl-nombre").value.trim();
  const dni       = document.getElementById("cl-dni").value.trim();
  const telefono  = document.getElementById("cl-telefono").value.trim();
  const direccion = document.getElementById("cl-direccion").value.trim();

  if (!nombre || !dni || !telefono || !direccion) { setAlert("modal-cliente-alert", "Completa todos los campos."); return; }
  if (!/^[0-9]{8}$/.test(dni))      { setAlert("modal-cliente-alert", "El DNI debe tener exactamente 8 dígitos numéricos."); return; }
  if (!/^[0-9]{9}$/.test(telefono)) { setAlert("modal-cliente-alert", "El teléfono debe tener exactamente 9 dígitos numéricos."); return; }

  try {
    const res  = await fetch("/api/clientes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asesorId: Estado.usuario.id, nombre, dni, telefono, direccion }),
    });
    const data = await res.json();
    if (!res.ok) { setAlert("modal-cliente-alert", data.mensaje); return; }

    Estado.clientes.push(data.cliente);
    toast(`Cliente "${nombre}" registrado correctamente.`);
    closeModal("modal-cliente");
    limpiar("cl-nombre", "cl-dni", "cl-telefono", "cl-direccion");
    setAlert("modal-cliente-alert", "");
    renderMisClientes();
  } catch { setAlert("modal-cliente-alert", "Error de conexión con el servidor."); }
}

// ══════════════════════════════════════════════
//  VENTAS  (asesor)
// ══════════════════════════════════════════════

async function cargarVentasAsesor() {
  try {
    const res = await fetch(`/api/ventas/asesor/${Estado.usuario.id}`);
    Estado.ventas = await res.json();
  } catch { Estado.ventas = []; }
}

function renderMisVentas() {
  if (Estado.ventas.length === 0) {
    document.getElementById("mis-ventas-tbody").innerHTML =
      `<tr><td colspan="9"><div class="empty-state"><div class="icon">◇</div>
       <p>Aún no tienes ventas registradas.<br>
       <a href="#" style="color:var(--gold)" onclick="navigate('nueva-venta')">Registra tu primera venta →</a></p>
       </div></td></tr>`;
    return;
  }

  document.getElementById("mis-ventas-tbody").innerHTML = [...Estado.ventas].reverse().map(v => `
    <tr>
      <td><code style="color:var(--text3);font-size:12px">#${v.idVenta}</code></td>
      <td>
        <strong>${v.cliente?.nombre || "—"}</strong>
        <div style="font-size:11px;color:var(--text3)">DNI: ${v.cliente?.dni || "—"}</div>
      </td>
      <td>${v.lote?.nombre || "—"}</td>
      <td>${badgeTipo(v.tipo)}</td>
      <td>${v.tipo === "FINANCIADO"
        ? `<span style="color:var(--info)">${v.numeroCuotas} cuotas</span>`
        : `<span style="color:var(--text3)">—</span>`}</td>
      <td style="color:var(--gold);font-weight:600">${fmt(v.total)}</td>
      <td style="color:var(--text2);font-size:12px">${fmtFechaCorta(v.fecha)}</td>
      <td>${badgeVenta(v.estado)}</td>
      <td>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="btn-info-sm" onclick="verDetalleVenta(${v.idVenta}, 'asesor')">Ver</button>
          ${v.estado === "ACTIVA" && v.tipo === "FINANCIADO"
            ? `<button class="btn-sm" onclick="irACuotas(${v.idVenta})">Cuotas</button>` : ""}
          ${v.estado === "ACTIVA"
            ? `<button class="btn-danger-sm" onclick="anularVentaAsesor(${v.idVenta})">Anular</button>` : ""}
        </div>
      </td>
    </tr>`).join("");
}

// ══════════════════════════════════════════════
//  NUEVA VENTA
// ══════════════════════════════════════════════

async function prepararNuevaVenta() {
  await cargarClientesAsesor();
  const lotes = await fetchLotes();
  const disp  = lotes.filter(l => l.estado === "DISPONIBLE");

  document.getElementById("nv-cliente").innerHTML = Estado.clientes.length === 0
    ? `<option value="">— Sin clientes. Ve a "Mis Clientes" primero —</option>`
    : `<option value="">Selecciona un cliente...</option>` +
      Estado.clientes.map(c => `<option value="${c.id}">${c.nombre}  ·  DNI: ${c.dni}</option>`).join("");

  document.getElementById("nv-lote").innerHTML = disp.length === 0
    ? `<option value="">— No hay lotes disponibles —</option>`
    : `<option value="">Selecciona un lote disponible...</option>` +
      disp.map(l => `<option value="${l.id}" data-precio="${l.precio}">${l.nombre}  ·  ${fmt(l.precio)}  |  Zona ${l.zona}  |  ${distribLabel[l.tipoDistribucion] || l.tipoDistribucion}  |  ${l.tamanio}m²</option>`).join("");

  document.getElementById("nv-tipo").value = "CONTADO";
  document.getElementById("nv-cuotas-group").style.display = "none";
  document.getElementById("nv-cuotas").value = "";
  document.getElementById("nv-preview").innerHTML = "";
  setAlert("nv-alert", "");
}

function toggleCuotas() {
  const tipo = document.getElementById("nv-tipo").value;
  document.getElementById("nv-cuotas-group").style.display = tipo === "FINANCIADO" ? "block" : "none";
  if (tipo === "CONTADO") {
    document.getElementById("nv-cuotas").value = "";
    document.getElementById("nv-preview").innerHTML = "";
  } else {
    previsualizarCuotas();
  }
}

function previsualizarCuotas() {
  const tipo    = document.getElementById("nv-tipo").value;
  const cuotas  = parseInt(document.getElementById("nv-cuotas").value);
  const loteOpt = document.querySelector("#nv-lote option:checked");
  const prev    = document.getElementById("nv-preview");

  if (tipo !== "FINANCIADO" || !cuotas || cuotas < 1 || !loteOpt || !loteOpt.value) {
    prev.innerHTML = ""; return;
  }

  const precio     = parseFloat(loteOpt.dataset.precio || "0");
  const montoCuota = precio / cuotas;

  prev.innerHTML = `
    <div class="plan-preview">
      <div class="plan-preview-title">📅 Vista previa del plan de pagos</div>
      <div class="plan-preview-grid">
        <div class="plan-item"><span>Precio total: </span><strong style="color:var(--gold)">${fmt(precio)}</strong></div>
        <div class="plan-item"><span>N° cuotas: </span><strong>${cuotas}</strong></div>
        <div class="plan-item"><span>Monto por cuota: </span><strong style="color:var(--success)">${fmt(montoCuota)}</strong></div>
        <div class="plan-item"><span>Periodicidad: </span><strong>Mensual</strong></div>
      </div>
    </div>`;
}

async function crearVenta() {
  const clienteId    = parseInt(document.getElementById("nv-cliente").value);
  const loteId       = parseInt(document.getElementById("nv-lote").value);
  const tipo         = document.getElementById("nv-tipo").value;
  const numeroCuotas = tipo === "FINANCIADO" ? parseInt(document.getElementById("nv-cuotas").value) : undefined;

  setAlert("nv-alert", "");
  if (!clienteId)  { setAlert("nv-alert", "Selecciona un cliente."); return; }
  if (!loteId)     { setAlert("nv-alert", "Selecciona un lote disponible."); return; }
  if (tipo === "FINANCIADO" && (!numeroCuotas || numeroCuotas < 1)) {
    setAlert("nv-alert", "Ingresa el número de cuotas (mínimo 1)."); return;
  }

  try {
    const res  = await fetch("/api/ventas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asesorId: Estado.usuario.id, clienteId, loteId, tipo, numeroCuotas }),
    });
    const data = await res.json();
    if (!res.ok) { setAlert("nv-alert", data.mensaje); return; }

    Estado.ventas.push(data.venta);
    const msg = tipo === "CONTADO"
      ? `Venta #${data.venta.idVenta} registrada. ¡Lote vendido al contado!`
      : `Venta #${data.venta.idVenta} registrada con plan de ${numeroCuotas} cuotas.`;
    toast(msg);
    document.getElementById("nv-preview").innerHTML = "";
    await cargarVentasAsesor();
    navigate("mis-ventas");
  } catch { setAlert("nv-alert", "Error de conexión con el servidor."); }
}

async function anularVentaAsesor(idVenta) {
  const venta = Estado.ventas.find(v => v.idVenta === idVenta);
  const info  = venta ? `"${venta.cliente?.nombre || "—"}" — ${venta.lote?.nombre || "—"}` : `#${idVenta}`;
  if (!confirm(`¿Anular la venta ${info}?\n\nSe aplicará una penalidad según la configuración actual.`)) return;

  try {
    const res  = await fetch(`/api/ventas/${idVenta}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }
    await cargarVentasAsesor();
    toast(`Venta #${idVenta} anulada. Penalidad: ${fmt(data.penalidad || 0)}`, "warn");
    renderMisVentas();
  } catch { toast("Error de conexión.", "error"); }
}

// ══════════════════════════════════════════════
//  DETALLE DE VENTA (modal)
// ══════════════════════════════════════════════

async function verDetalleVenta(idVenta, origen) {
  // Buscar en caches locales
  let venta = Estado.ventas.find(v => v.idVenta === idVenta)
           || Estado.ventasCache.find(v => v.id === idVenta);

  if (!venta) return;

  const esAsesor = origen === "asesor";
  // CORRECCIÓN: para jefe, el id está en venta.id; para asesor, en venta.idVenta
  const idReal   = esAsesor ? venta.idVenta : venta.id;
  const cliente  = venta.cliente || {};
  const loteNom  = esAsesor ? (venta.lote?.nombre || "—") : (venta.loteNombre || "—");
  const total    = venta.total || 0;

  let cuotasHtml = "";
  if (venta.tipo === "FINANCIADO" &&
     (venta.estado === "ACTIVA" || venta.estado === "COMPLETADA")) {
    try {
      const r = await fetch(`/api/ventas/${idReal}/cuotas`);
      const d = await r.json();
      if (r.ok) {
        cuotasHtml = `
          <div style="margin-top:16px">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);margin-bottom:10px;font-weight:700">Plan de Cuotas</div>
            <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
              <span class="badge badge-completada">Pagadas: ${d.pagadas}</span>
              <span class="badge badge-activa">Pendientes: ${d.pendientes}</span>
              <span class="badge badge-reservado">Total: ${d.totalCuotas}</span>
            </div>
          </div>`;
      }
    } catch {}
  }

  document.getElementById("modal-detalle-content").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-label">ID Venta</div>
        <div class="detail-value" style="color:var(--gold)">#${idReal}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Estado</div>
        <div class="detail-value">${badgeVenta(venta.estado)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Cliente</div>
        <div class="detail-value">${cliente.nombre || "—"}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">DNI</div>
        <div class="detail-value">${cliente.dni || "—"}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Lote</div>
        <div class="detail-value">${loteNom}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Tipo de Pago</div>
        <div class="detail-value">${badgeTipo(venta.tipo)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Total</div>
        <div class="detail-value" style="color:var(--gold);font-size:18px">${fmt(total)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Fecha</div>
        <div class="detail-value">${fmtFecha(venta.fecha)}</div>
      </div>
      ${venta.tipo === "FINANCIADO" ? `
      <div class="detail-item">
        <div class="detail-label">N° Cuotas</div>
        <div class="detail-value" style="color:var(--info)">${venta.numeroCuotas} meses</div>
      </div>` : ""}
    </div>
    ${cuotasHtml}`;

  openModal("modal-detalle-venta");
}

// ══════════════════════════════════════════════
//  CUOTAS
// ══════════════════════════════════════════════

function irACuotas(idVenta) {
  navigate("cuotas");
  setTimeout(() => {
    const sel = document.getElementById("cuota-venta-select");
    if (sel) { sel.value = idVenta; cargarCuotas(); }
  }, 150);
}

async function prepararCuotas() {
  await cargarVentasAsesor();
  const fin = Estado.ventas.filter(v => v.tipo === "FINANCIADO" && v.estado === "ACTIVA");
  const sel = document.getElementById("cuota-venta-select");
  sel.innerHTML = fin.length === 0
    ? `<option value="">— Sin ventas financiadas activas —</option>`
    : `<option value="">Selecciona una venta...</option>` +
      fin.map(v => `<option value="${v.idVenta}">
        Venta #${v.idVenta} — ${v.cliente?.nombre || "—"} | ${v.lote?.nombre || "—"} | ${v.numeroCuotas} cuotas
      </option>`).join("");
  document.getElementById("cuotas-card").style.display = "none";
  if (fin.length === 1) { sel.value = fin[0].idVenta; cargarCuotas(); }
}

async function cargarCuotas() {
  const idVenta = parseInt(document.getElementById("cuota-venta-select").value);
  const card    = document.getElementById("cuotas-card");
  if (!idVenta) { card.style.display = "none"; return; }

  try {
    const res  = await fetch(`/api/ventas/${idVenta}/cuotas`);
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }

    card.style.display = "block";

    const progPct = Math.round(data.pagadas / data.totalCuotas * 100);
    document.getElementById("cuotas-resumen-header").innerHTML = `
      <div class="cuotas-resumen-bar">
        <span class="badge badge-completada">✓ ${data.pagadas} pagadas</span>
        <span class="badge badge-activa">${data.pendientes} pendientes</span>
        <span style="color:var(--text3);font-size:12px">${progPct}% completado</span>
      </div>`;

    document.getElementById("cuotas-tbody").innerHTML = data.cuotas.map(c => {
      const vencido = !c.pagada && new Date(c.fechaVencimiento) < new Date();
      return `
        <tr>
          <td><strong style="color:${vencido ? "var(--danger)" : "var(--text)"}">#${c.numero}</strong></td>
          <td>${fmt(c.montoBase)}</td>
          <td style="${vencido ? "color:var(--danger)" : ""}">
            ${fmtFecha(c.fechaVencimiento)}
            ${vencido ? `<div style="font-size:10px;color:var(--danger);font-weight:600">⚠ VENCIDA</div>` : ""}
          </td>
          <td>${c.montoInteres > 0
            ? `<span style="color:var(--danger);font-weight:600">${fmt(c.montoInteres)}</span>`
            : `<span style="color:var(--text3)">—</span>`}</td>
          <td><strong style="color:var(--text)">${fmt((c.montoBase || 0) + (c.montoInteres || 0))}</strong></td>
          <td>${c.pagada
            ? `<div><span class="badge badge-completada">Pagada</span>
               <div style="font-size:10px;color:var(--text3);margin-top:2px">${fmtFecha(c.fechaPago)}</div></div>`
            : `<span class="badge ${vencido ? "badge-anulada" : "badge-activa"}">Pendiente</span>`}</td>
          <td>${!c.pagada
            ? `<button class="btn-sm" onclick="pagarCuota(${idVenta},${c.numero})">Registrar pago</button>`
            : `<span style="color:var(--success);font-size:14px">✓</span>`}</td>
        </tr>`;
    }).join("");
  } catch { toast("Error al cargar las cuotas.", "error"); }
}

async function pagarCuota(idVenta, num) {
  if (!confirm(`¿Registrar el pago de la cuota #${num}?\n\nSe calculará mora si la fecha está vencida.`)) return;
  try {
    const res  = await fetch(`/api/ventas/${idVenta}/cuotas/${num}/pagar`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaPago: new Date().toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }

    let msg = `Cuota #${num} pagada. Total: ${fmt(data.montoTotal)}`;
    if (data.diasMora > 0) msg += ` · Mora: ${data.diasMora} días (+${fmt(data.montoInteres)})`;
    if (data.ventaCompletada) msg += "  🎉 ¡Venta completada!";

    toast(msg, data.diasMora > 0 ? "warn" : "success");

    if (data.ventaCompletada) {
      await cargarVentasAsesor();
      await prepararCuotas();
    } else {
      cargarCuotas();
    }
  } catch { toast("Error de conexión.", "error"); }
}

// ══════════════════════════════════════════════
//  ASESORES  (jefe)
// ══════════════════════════════════════════════

async function cargarAsesores() {
  try {
    const [asesores, ventas] = await Promise.all([
      (await fetch("/api/asesores")).json(),
      fetchTodasVentas(),
    ]);
    const ventasPorAsesor = ventas.reduce((acc, v) => {
      acc[v.asesorId] = (acc[v.asesorId] || 0) + 1; return acc;
    }, {});
    const clientesPorAsesor = ventas.reduce((acc, v) => {
      if (!acc[v.asesorId]) acc[v.asesorId] = new Set();
      if (v.cliente?.id) acc[v.asesorId].add(v.cliente.id);
      return acc;
    }, {});

    document.getElementById("asesores-tbody").innerHTML = asesores.length === 0
      ? `<tr><td colspan="7"><div class="empty-state"><div class="icon">◎</div><p>Sin asesores registrados.</p></div></td></tr>`
      : asesores.map(a => `
          <tr>
            <td><code style="color:var(--text3);font-size:12px">#${a.id}</code></td>
            <td><strong>${a.nombre}</strong></td>
            <td><code style="background:var(--surface);padding:2px 8px;border-radius:5px;font-size:12px">${a.usuario}</code></td>
            <td style="color:var(--info)">${clientesPorAsesor[a.id]?.size || 0}</td>
            <td style="color:var(--gold)">${ventasPorAsesor[a.id] || 0}</td>
            <td>${a.bloqueado
              ? `<span class="badge badge-anulada">Bloqueado</span>`
              : `<span class="badge badge-completada">Activo</span>`}</td>
            <td>
              ${a.bloqueado
                ? `<button class="btn-sm" onclick="desbloquearUsuario(${a.id})">Desbloquear</button>`
                : `<span style="color:var(--text3);font-size:12px">—</span>`}
            </td>
          </tr>`).join("");
  } catch { toast("Error al cargar asesores.", "error"); }
}

async function agregarAsesor() {
  const nombre     = document.getElementById("as-nombre").value.trim();
  const usuario    = document.getElementById("as-usuario").value.trim();
  const contraseña = document.getElementById("as-contraseña").value;

  if (!nombre || !usuario || !contraseña) { setAlert("modal-asesor-alert", "Completa todos los campos."); return; }
  if (contraseña.length < 4) { setAlert("modal-asesor-alert", "La contraseña debe tener al menos 4 caracteres."); return; }

  try {
    const res  = await fetch("/api/asesores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jefeId: Estado.usuario.id, nombre, usuario, contraseña }),
    });
    const data = await res.json();
    if (!res.ok) { setAlert("modal-asesor-alert", data.mensaje); return; }
    toast(`Asesor "${nombre}" agregado correctamente.`);
    closeModal("modal-asesor");
    limpiar("as-nombre", "as-usuario", "as-contraseña");
    setAlert("modal-asesor-alert", "");
    cargarAsesores();
  } catch { setAlert("modal-asesor-alert", "Error de conexión."); }
}

async function desbloquearUsuario(id) {
  if (!confirm("¿Desbloquear este asesor?")) return;
  try {
    const res  = await fetch(`/api/usuarios/${id}/desbloquear`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jefeId: Estado.usuario.id }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }
    toast("Usuario desbloqueado correctamente.");
    cargarAsesores();
  } catch { toast("Error de conexión.", "error"); }
}

// ══════════════════════════════════════════════
//  TODAS LAS VENTAS  (jefe)
// ══════════════════════════════════════════════

async function fetchTodasVentas() {
  try { return await (await fetch("/api/ventas")).json(); } catch { return []; }
}

async function cargarTodasVentas() {
  const ventas = await fetchTodasVentas();
  Estado.ventasCache = ventas;

  document.getElementById("todas-ventas-tbody").innerHTML = ventas.length === 0
    ? `<tr><td colspan="10"><div class="empty-state"><div class="icon">◈</div><p>Sin ventas registradas.</p></div></td></tr>`
    : ventas.map(v => `
        <tr data-estado="${v.estado}">
          <td><code style="color:var(--text3);font-size:12px">#${v.id}</code></td>
          <td>
            <strong>${v.cliente?.nombre || "—"}</strong>
            <div style="font-size:11px;color:var(--text3)">DNI: ${v.cliente?.dni || "—"}</div>
          </td>
          <td style="color:var(--text2)">${v.asesorNombre}</td>
          <td>${v.loteNombre}</td>
          <td>${badgeTipo(v.tipo)}</td>
          <td>${v.tipo === "FINANCIADO"
            ? `<span style="color:var(--info);font-size:12px">${v.numeroCuotas} cuotas</span>`
            : `<span style="color:var(--text3)">—</span>`}</td>
          <td style="color:var(--gold);font-weight:600">${fmt(v.total)}</td>
          <td style="color:var(--text2);font-size:12px">${fmtFechaCorta(v.fecha)}</td>
          <td>${badgeVenta(v.estado)}</td>
          <td>
            <div style="display:flex;gap:5px">
              <button class="btn-info-sm" onclick="verDetalleVenta(${v.id}, 'jefe')">Ver</button>
              ${v.estado === "ACTIVA"
                ? `<button class="btn-danger-sm" onclick="anularVentaJefe(${v.id})">Anular</button>` : ""}
            </div>
          </td>
        </tr>`).join("");

  filtrarVentasJefe();
}

async function anularVentaJefe(idVenta) {
  const venta = Estado.ventasCache.find(v => v.id === idVenta);
  const info  = venta ? `"${venta.cliente?.nombre || "—"}" — Lote: ${venta.loteNombre}` : `#${idVenta}`;
  if (!confirm(`¿Anular la venta ${info}?\n\nEsta acción es irreversible.`)) return;

  try {
    const res  = await fetch(`/api/ventas/${idVenta}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }
    toast(`Venta #${idVenta} anulada. Penalidad: ${fmt(data.penalidad || 0)}`, "warn");
    cargarTodasVentas();
  } catch { toast("Error de conexión.", "error"); }
}

// ══════════════════════════════════════════════
//  REPORTES  (jefe)
// ══════════════════════════════════════════════

async function cargarReportes() {
  try {
    const data = await (await fetch("/api/reportes")).json();

    document.getElementById("reporte-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Ventas</div>
        <div class="stat-value">${data.totalVentas}</div>
        <div class="stat-sub">Historial completo</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ingresos Confirmados</div>
        <div class="stat-value small">${fmt(data.ingresosTotales)}</div>
        <div class="stat-sub">De ventas completadas</div>
      </div>`;

    document.getElementById("historial-tbody").innerHTML = !data.historial?.length
      ? `<tr><td colspan="7"><div class="empty-state"><div class="icon">◉</div><p>Sin historial de ventas.</p></div></td></tr>`
      : data.historial.map(h => `
          <tr>
            <td><code style="color:var(--text3);font-size:12px">#${h.idVenta}</code></td>
            <td>${h.cliente}</td>
            <td style="color:var(--text2)">${h.asesor}</td>
            <td>${badgeTipo(h.metodoDePago)}</td>
            <td style="color:var(--gold);font-weight:600">${fmt(h.precioVenta)}</td>
            <td style="color:var(--text2);font-size:12px">${fmtFecha(h.fecha)}</td>
            <td style="color:var(--text3);font-size:11px">${h.detalles}</td>
          </tr>`).join("");

    if (data.asesorTop) {
      document.getElementById("asesor-top").innerHTML = `
        <div class="top-asesor-card">
          <div class="top-asesor-avatar">🏆</div>
          <div class="top-asesor-name">${data.asesorTop.nombre}</div>
          <div style="color:var(--text3);font-size:12px;margin-top:4px">
            Usuario: <code style="background:var(--surface);padding:1px 7px;border-radius:4px">${data.asesorTop.usuario}</code>
          </div>
          <div class="top-asesor-stats">
            <div class="top-stat">
              <div class="top-stat-val">${data.totalVentas}</div>
              <div class="top-stat-lbl">Total ventas</div>
            </div>
            <div class="top-stat">
              <div class="top-stat-val" style="color:var(--success)">${fmt(data.ingresosTotales)}</div>
              <div class="top-stat-lbl">Ingresos</div>
            </div>
          </div>
        </div>`;
    } else {
      document.getElementById("asesor-top").innerHTML =
        `<div class="empty-state"><div class="icon">🏆</div><p>Sin datos suficientes.</p></div>`;
    }
  } catch { toast("Error al cargar reportes.", "error"); }
}

// ══════════════════════════════════════════════
//  CONFIGURACIÓN  (jefe)
// ══════════════════════════════════════════════

async function cargarConfiguracion() {
  try {
    const cfg = await (await fetch("/api/config")).json();
    document.getElementById("cfg-tasa").value      = cfg.tasaInteresDiaria     ?? "";
    document.getElementById("cfg-penalidad").value = cfg.porcentajePenalidad   ?? "";
    mostrarConfigActual(cfg);
  } catch {}
}

function mostrarConfigActual(cfg) {
  const tasa = cfg.tasaInteresDiaria   ?? 0;
  const pen  = cfg.porcentajePenalidad ?? 0;
  const el   = document.getElementById("cfg-actual");
  if (!el) return;
  el.innerHTML = `
    <div class="cfg-item">
      <div class="cfg-item-label">Tasa Diaria Actual</div>
      <div class="cfg-item-value">${(tasa * 100).toFixed(3)}%</div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">por día de mora</div>
    </div>
    <div class="cfg-item">
      <div class="cfg-item-label">Penalidad por Anulación</div>
      <div class="cfg-item-value">${(pen * 100).toFixed(0)}%</div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">del precio del lote</div>
    </div>`;
}

// CORRECCIÓN: funciones previewTasa y previewPenalidad referenciadas en el HTML
function previewTasa() {
  const t   = parseFloat(document.getElementById("cfg-tasa").value);
  const el  = document.getElementById("cfg-tasa-preview");
  if (!el) return;
  if (isNaN(t) || t < 0) { el.classList.remove("visible"); return; }
  el.classList.add("visible");
  el.innerHTML = `Equivale a <strong style="color:var(--gold)">${(t * 100).toFixed(3)}%</strong> diario de mora`;
}

function previewPenalidad() {
  const p  = parseFloat(document.getElementById("cfg-penalidad").value);
  const el = document.getElementById("cfg-pen-preview");
  if (!el) return;
  if (isNaN(p) || p < 0) { el.classList.remove("visible"); return; }
  el.classList.add("visible");
  el.innerHTML = `Se cobra <strong style="color:var(--danger)">${(p * 100).toFixed(0)}%</strong> del precio del lote al anular`;
}

async function actualizarTasa() {
  const tasa = parseFloat(document.getElementById("cfg-tasa").value);
  if (isNaN(tasa) || tasa < 0 || tasa > 1) {
    toast("La tasa debe estar entre 0 y 1. Ejemplo: 0.001", "error"); return;
  }
  try {
    const res  = await fetch("/api/config/tasa", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jefeId: Estado.usuario.id, tasa }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }
    toast(`Tasa de interés actualizada a ${(tasa * 100).toFixed(3)}% diario.`);
    cargarConfiguracion();
  } catch { toast("Error de conexión.", "error"); }
}

async function actualizarPenalidad() {
  const penalidad = parseFloat(document.getElementById("cfg-penalidad").value);
  if (isNaN(penalidad) || penalidad < 0 || penalidad > 1) {
    toast("La penalidad debe estar entre 0 y 1. Ejemplo: 0.10", "error"); return;
  }
  try {
    const res  = await fetch("/api/config/penalidad", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jefeId: Estado.usuario.id, penalidad }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data.mensaje, "error"); return; }
    toast(`Penalidad por anulación actualizada a ${(penalidad * 100).toFixed(0)}%.`);
    cargarConfiguracion();
  } catch { toast("Error de conexión.", "error"); }
}