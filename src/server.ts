import express from "express";
import path from "path";
import fs from "fs";

import { UsuarioRepositoryArchivo } from "./Infraestructura/Repositories/UsuarioRepositoryArchivo";
import { LoteRepositoryArchivo }    from "./Infraestructura/Repositories/LoteRepositoryArchivo";
import { VentaRepositoryArchivo }   from "./Infraestructura/Repositories/VentaRepositoryArchivo";

import { AuthService }     from "./Aplicacion/services/AuthService";
import { UsuarioService }  from "./Aplicacion/services/UsuarioService";
import { LoteService }     from "./Aplicacion/services/LoteService";
import { VentaService }    from "./Aplicacion/services/VentaService";
import { ReporteService }  from "./Aplicacion/services/ReporteService";

import { TipoUsuario }     from "./Dominio/enums/TipoUsuario";
import { TipoVenta }       from "./Dominio/enums/TipoVenta";
import { Asesor }          from "./Dominio/models/Asesor";
import { Jefe }            from "./Dominio/models/Jefe";
import { Cliente }         from "./Dominio/models/Cliente";
import { PlanPago }        from "./Dominio/models/PlanPago";

const app = express();
app.use(express.json());

// ══════════════════════════════════════════════════════
//  ARCHIVOS DE DATOS
// ══════════════════════════════════════════════════════

const DATA_DIR        = path.resolve("src/Infraestructura/Data");
const CLIENTES_PATH   = path.join(DATA_DIR, "clientes.json");
const CUOTAS_PATH     = path.join(DATA_DIR, "cuotas.json");
const VENTAS_PATH     = path.join(DATA_DIR, "ventas.json");
const HISTORIAL_PATH  = path.join(DATA_DIR, "historial.json");  // ← NUEVO
const CONFIG_PATH     = path.join(DATA_DIR, "config.json");

// Crear archivos si no existen
if (!fs.existsSync(CLIENTES_PATH))  fs.writeFileSync(CLIENTES_PATH,  "[]");
if (!fs.existsSync(CUOTAS_PATH))    fs.writeFileSync(CUOTAS_PATH,    "{}");
if (!fs.existsSync(HISTORIAL_PATH)) fs.writeFileSync(HISTORIAL_PATH, "[]"); // ← NUEVO
if (!fs.existsSync(CONFIG_PATH))
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ tasaInteresDiaria: 0.001, porcentajePenalidad: 0.10 }, null, 2));

const leerJSON     = (r: string) => JSON.parse(fs.readFileSync(r, "utf-8"));
const escribirJSON = (r: string, d: any) => fs.writeFileSync(r, JSON.stringify(d, null, 2));

// ══════════════════════════════════════════════════════
//  REPOSITORIOS
// ══════════════════════════════════════════════════════

const usuarioRepo = new UsuarioRepositoryArchivo();
const loteRepo    = new LoteRepositoryArchivo();
const ventaRepo   = new VentaRepositoryArchivo(usuarioRepo, loteRepo);

function makeServicios() {
  const usuarios = usuarioRepo.obtenerTodos();
  const lotes    = loteRepo.obtenerTodos();
  const ventas   = ventaRepo.obtenerTodos();
  const asesores = usuarios.filter(u => u.getTipo() === TipoUsuario.ASESOR);

  const authService    = new AuthService(usuarios);
  const usuarioService = new UsuarioService(usuarios, usuarioRepo);
  const loteService    = new LoteService(lotes);
  const ventaService   = new VentaService(ventas, lotes, [], 0.001, 0.10);
  const reporteService = new ReporteService(ventas, asesores);

  return { authService, usuarioService, loteService, ventaService, reporteService, usuarios, lotes, ventas };
}

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════

const serializarUsuario = (u: any) => ({
  id:        u.getId(),
  nombre:    u.getNombre(),
  usuario:   u.getUsuario(),
  tipo:      u.getTipo(),
  bloqueado: u.estaBloqueado(),
});

function getAsesor(asesorId: number): Asesor | null {
  const usuarios = usuarioRepo.obtenerTodos();
  const u = usuarios.find(x => x.getId() === asesorId);
  if (!u || u.getTipo() !== TipoUsuario.ASESOR) return null;

  const asesor = u as Asesor;
  const todosClientes: any[] = leerJSON(CLIENTES_PATH);
  todosClientes
    .filter(c => c.asesorId === asesorId)
    .forEach(c => {
      try {
        const cliente = new Cliente(c.id, c.nombre, c.dni, c.telefono, c.direccion);
        (asesor as any).clientes.push(cliente);
        if (c.id >= (asesor as any).contadorClientes)
          (asesor as any).contadorClientes = c.id + 1;
      } catch (_) {}
    });

  return asesor;
}

function getJefe(jefeId: number): Jefe | null {
  const usuarios = usuarioRepo.obtenerTodos();
  const u = usuarios.find(x => x.getId() === jefeId);
  if (!u || u.getTipo() !== TipoUsuario.JEFE) return null;
  return u as Jefe;
}

// ──────────────────────────────────────────────────────
//  HISTORIAL — leer/guardar desde historial.json
// ──────────────────────────────────────────────────────

function leerHistorial(): any[] {
  return leerJSON(HISTORIAL_PATH);
}

function agregarAlHistorial(entrada: {
  idVenta:      number;
  cliente:      string;
  asesor:       string;
  fecha:        string;
  metodoDePago: string;
  precioVenta:  number;
  detalles:     string;
}) {
  const historial = leerHistorial();
  historial.push(entrada);
  escribirJSON(HISTORIAL_PATH, historial);
}

// ══════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════

app.post("/api/login", (req, res) => {
  const { usuario, contraseña } = req.body;
  if (!usuario || !contraseña)
    return res.status(400).json({ exito: false, mensaje: "Completa todos los campos." });

  const { authService } = makeServicios();
  const resultado = authService.login(usuario, contraseña);

  if (!resultado.exito || !resultado.usuario)
    return res.status(401).json({ exito: false, mensaje: resultado.mensaje });

  return res.json({
    exito: true,
    mensaje: resultado.mensaje,
    usuario: serializarUsuario(resultado.usuario),
  });
});

// ══════════════════════════════════════════════════════
//  LOTES
// ══════════════════════════════════════════════════════

app.get("/api/lotes", (_req, res) => {
  const lotes = loteRepo.obtenerTodos();
  res.json(lotes.map(l => ({
    id:               l.getIdLote(),
    nombre:           l.getNombre(),
    tamanio:          l.getTamanio(),
    ubicacion:        l.getUbicacion(),
    zona:             l.getZona(),
    tipoDistribucion: l.getTipoDistribucion(),
    precio:           l.getPrecio(),
    estado:           l.getEstado(),
  })));
});

app.post("/api/lotes", (req, res) => {
  const { jefeId, nombre, tamanio, ubicacion, zona, tipoDistribucion, precio } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede registrar lotes." });

  const { loteService } = makeServicios();
  try {
    const lote = loteService.registrarLote(
      jefe, nombre, Number(tamanio), ubicacion, zona, tipoDistribucion, Number(precio)
    );
    loteRepo.guardar(lote);
    return res.json({
      mensaje: "Lote registrado correctamente.",
      lote: { id: lote.getIdLote(), nombre: lote.getNombre(), precio: lote.getPrecio(), estado: lote.getEstado() }
    });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════
//  CLIENTES
// ══════════════════════════════════════════════════════

app.get("/api/clientes", (req, res) => {
  const asesorId = Number(req.query.asesorId);
  if (!asesorId) return res.status(400).json({ mensaje: "asesorId requerido." });
  const todos: any[] = leerJSON(CLIENTES_PATH);
  res.json(todos.filter(c => c.asesorId === asesorId));
});

app.post("/api/clientes", (req, res) => {
  const { asesorId, nombre, dni, telefono, direccion } = req.body;

  const usuarios = usuarioRepo.obtenerTodos();
  const u = usuarios.find(x => x.getId() === Number(asesorId));
  if (!u || u.getTipo() !== TipoUsuario.ASESOR)
    return res.status(403).json({ mensaje: "Solo un asesor puede registrar clientes." });

  if (!nombre || !String(nombre).trim())
    return res.status(400).json({ mensaje: "El nombre es obligatorio." });
  if (!/^[0-9]{8}$/.test(String(dni)))
    return res.status(400).json({ mensaje: "El DNI debe tener exactamente 8 dígitos numéricos." });
  if (!/^[0-9]{9}$/.test(String(telefono)))
    return res.status(400).json({ mensaje: "El teléfono debe tener exactamente 9 dígitos numéricos." });
  if (!direccion || !String(direccion).trim())
    return res.status(400).json({ mensaje: "La dirección es obligatoria." });

  const todos: any[] = leerJSON(CLIENTES_PATH);
  const existe = todos.some(c =>
    c.asesorId === Number(asesorId) && (c.dni === String(dni) || c.telefono === String(telefono))
  );
  if (existe)
    return res.status(400).json({ mensaje: "Ya existe un cliente con el mismo DNI o teléfono." });

  const nuevoId = todos.length > 0 ? Math.max(...todos.map(c => c.id)) + 1 : 1;
  const cliente = { id: nuevoId, asesorId: Number(asesorId), nombre, dni: String(dni), telefono: String(telefono), direccion };
  todos.push(cliente);
  escribirJSON(CLIENTES_PATH, todos);

  return res.json({ mensaje: "Cliente registrado.", cliente });
});

// ══════════════════════════════════════════════════════
//  VENTAS
// ══════════════════════════════════════════════════════

app.get("/api/ventas", (_req, res) => {
  const ventasRaw: any[] = leerJSON(VENTAS_PATH);
  const usuarios = usuarioRepo.obtenerTodos();
  const lotes    = loteRepo.obtenerTodos();

  res.json(ventasRaw.map(v => {
    const asesor = usuarios.find(u => u.getId() === v.asesorId);
    const lote   = lotes.find(l => l.getIdLote() === v.loteId);
    return {
      id:           v.id,
      cliente:      v.cliente,
      asesorId:     v.asesorId,
      asesorNombre: asesor?.getNombre() || "—",
      loteId:       v.loteId,
      loteNombre:   lote?.getNombre()   || "—",
      tipo:         v.tipo,
      numeroCuotas: v.numeroCuotas || 0,
      total:        lote?.getPrecio()   || 0,
      estado:       v.estado,
      fecha:        v.fecha,
    };
  }));
});

app.get("/api/ventas/asesor/:asesorId", (req, res) => {
  const asesorId  = Number(req.params.asesorId);
  const ventasRaw: any[] = leerJSON(VENTAS_PATH);
  const lotes     = loteRepo.obtenerTodos();

  res.json(
    ventasRaw
      .filter(v => v.asesorId === asesorId)
      .map(v => {
        const lote = lotes.find(l => l.getIdLote() === v.loteId);
        return {
          idVenta:      v.id,
          cliente:      v.cliente,
          lote:         { id: v.loteId, nombre: lote?.getNombre() || "—" },
          tipo:         v.tipo,
          numeroCuotas: v.numeroCuotas || 0,
          total:        lote?.getPrecio() || 0,
          estado:       v.estado,
          fecha:        v.fecha,
        };
      })
  );
});

app.post("/api/ventas", (req, res) => {
  const { asesorId, clienteId, loteId, tipo, numeroCuotas } = req.body;

  const asesor = getAsesor(Number(asesorId));
  if (!asesor) return res.status(403).json({ mensaje: "Asesor no encontrado." });

  const cliente = asesor.buscarClientePorId(Number(clienteId));
  if (!cliente) return res.status(400).json({ mensaje: "Cliente no encontrado para este asesor." });

  const lote = loteRepo.buscarPorId(Number(loteId));
  if (!lote)              return res.status(400).json({ mensaje: "Lote no encontrado." });
  if (!lote.estaDisponible()) return res.status(400).json({ mensaje: "El lote no está disponible." });

  if (tipo === "FINANCIADO" && (!numeroCuotas || Number(numeroCuotas) < 1))
    return res.status(400).json({ mensaje: "Debes indicar un número de cuotas válido (mínimo 1)." });

  try {
    const tipoVenta = tipo === "FINANCIADO" ? TipoVenta.FINANCIADO : TipoVenta.CONTADO;
    lote.reservar();

    const ventasRaw: any[] = leerJSON(VENTAS_PATH);
    const nuevoId = ventasRaw.length > 0 ? Math.max(...ventasRaw.map(v => v.id)) + 1 : 1;

    // Leer tasa desde config
    const config = leerJSON(CONFIG_PATH);
    const tasa   = config.tasaInteresDiaria ?? 0.001;

    const nuevaVenta: any = {
      id:              nuevoId,
      cliente: {
        id:        cliente.getId(),
        nombre:    cliente.getNombre(),
        dni:       cliente.getDni(),
        telefono:  cliente.getTelefono(),
        direccion: cliente.getDireccion(),
      },
      asesorId:          asesor.getId(),
      loteId:            lote.getIdLote(),
      tipo:              tipoVenta,
      tasaInteresDiaria: tasa,
      numeroCuotas:      tipoVenta === TipoVenta.FINANCIADO ? Number(numeroCuotas) : 0,
      fecha:             new Date().toISOString(),
      estado:            "ACTIVA",
    };

    if (tipoVenta === TipoVenta.CONTADO) {
      nuevaVenta.estado = "COMPLETADA";
      lote.vender();
    }

    ventasRaw.push(nuevaVenta);
    escribirJSON(VENTAS_PATH, ventasRaw);
    actualizarEstadoLote(lote.getIdLote(), lote.getEstado());

    if (tipoVenta === TipoVenta.FINANCIADO) {
      const plan = new PlanPago(lote.getPrecio(), Number(numeroCuotas), tasa);
      const cuotasData: any = leerJSON(CUOTAS_PATH);
      cuotasData[nuevoId.toString()] = plan.getCuotas().map((c: any) => ({
        numero:           c.getNumero(),
        montoBase:        c.getMontoBase(),
        fechaVencimiento: c.getFechaVencimiento(),
        pagada:           false,
        montoInteres:     0,
        fechaPago:        null,
      }));
      escribirJSON(CUOTAS_PATH, cuotasData);
    }

    // ── GUARDAR EN HISTORIAL ──────────────────────────
    const detalles = tipoVenta === TipoVenta.FINANCIADO
      ? `Venta financiada en ${numeroCuotas} cuotas`
      : "Venta al contado";

    agregarAlHistorial({
      idVenta:      nuevoId,
      cliente:      cliente.getNombre(),
      asesor:       asesor.getNombre(),
      fecha:        new Date().toISOString(),
      metodoDePago: tipoVenta.toString(),
      precioVenta:  lote.getPrecio(),
      detalles,
    });
    // ─────────────────────────────────────────────────

    return res.json({
      mensaje: "Venta registrada correctamente.",
      venta: {
        idVenta:      nuevaVenta.id,
        cliente:      nuevaVenta.cliente,
        lote:         { id: lote.getIdLote(), nombre: lote.getNombre() },
        tipo:         nuevaVenta.tipo,
        numeroCuotas: nuevaVenta.numeroCuotas,
        total:        lote.getPrecio(),
        estado:       nuevaVenta.estado,
        fecha:        nuevaVenta.fecha,
      }
    });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

app.delete("/api/ventas/:id", (req, res) => {
  const idVenta = Number(req.params.id);
  const ventasRaw: any[] = leerJSON(VENTAS_PATH);
  const idx = ventasRaw.findIndex(v => v.id === idVenta);

  if (idx === -1) return res.status(404).json({ mensaje: "Venta no encontrada." });

  const venta = ventasRaw[idx];
  if (venta.estado === "ANULADA")    return res.status(400).json({ mensaje: "La venta ya está anulada." });
  if (venta.estado === "COMPLETADA") return res.status(400).json({ mensaje: "No se puede anular una venta completada." });

  const lote      = loteRepo.buscarPorId(venta.loteId);
  const config    = leerJSON(CONFIG_PATH);
  const pct       = config.porcentajePenalidad ?? 0.10;
  const penalidad = lote ? lote.getPrecio() * pct : 0;

  ventasRaw[idx].estado = "ANULADA";
  escribirJSON(VENTAS_PATH, ventasRaw);

  if (lote) actualizarEstadoLote(lote.getIdLote(), "DISPONIBLE");

  const cuotas: any = leerJSON(CUOTAS_PATH);
  delete cuotas[idVenta.toString()];
  escribirJSON(CUOTAS_PATH, cuotas);

  // ── GUARDAR ANULACIÓN EN HISTORIAL ───────────────
  const usuarios = usuarioRepo.obtenerTodos();
  const asesor   = usuarios.find(u => u.getId() === venta.asesorId);
  agregarAlHistorial({
    idVenta,
    cliente:      venta.cliente?.nombre || "—",
    asesor:       asesor?.getNombre()   || "—",
    fecha:        new Date().toISOString(),
    metodoDePago: venta.tipo,
    precioVenta:  lote?.getPrecio()     || 0,
    detalles:     `Venta anulada — penalidad: S/ ${penalidad.toFixed(2)}`,
  });
  // ─────────────────────────────────────────────────

  return res.json({ mensaje: "Venta anulada. Penalidad aplicada.", penalidad });
});

// ══════════════════════════════════════════════════════
//  CUOTAS
// ══════════════════════════════════════════════════════

app.get("/api/ventas/:id/cuotas", (req, res) => {
  const idVenta = Number(req.params.id);
  const cuotasData: any = leerJSON(CUOTAS_PATH);
  let ventaCuotas = cuotasData[idVenta.toString()];

  if (!ventaCuotas) {
    const ventasRaw: any[] = leerJSON(VENTAS_PATH);
    const ventaData = ventasRaw.find(v => v.id === idVenta);
    if (!ventaData) return res.status(404).json({ mensaje: "Venta no encontrada." });
    if (ventaData.tipo !== "FINANCIADO") return res.status(400).json({ mensaje: "La venta no es financiada." });

    const lote = loteRepo.buscarPorId(ventaData.loteId);
    if (!lote) return res.status(404).json({ mensaje: "Lote no encontrado." });

    const plan = new PlanPago(lote.getPrecio(), ventaData.numeroCuotas, ventaData.tasaInteresDiaria || 0.001);
    ventaCuotas = plan.getCuotas().map((c: any) => ({
      numero:           c.getNumero(),
      montoBase:        c.getMontoBase(),
      fechaVencimiento: c.getFechaVencimiento(),
      pagada:           false,
      montoInteres:     0,
      fechaPago:        null,
    }));
    cuotasData[idVenta.toString()] = ventaCuotas;
    escribirJSON(CUOTAS_PATH, cuotasData);
  }

  const pagadas    = ventaCuotas.filter((c: any) => c.pagada).length;
  const pendientes = ventaCuotas.filter((c: any) => !c.pagada).length;

  return res.json({ ventaId: idVenta, totalCuotas: ventaCuotas.length, pagadas, pendientes, cuotas: ventaCuotas });
});

app.post("/api/ventas/:id/cuotas/:numero/pagar", (req, res) => {
  const idVenta     = Number(req.params.id);
  const numeroCuota = Number(req.params.numero);
  const fechaPago   = new Date(req.body.fechaPago || new Date());

  const cuotasData: any    = leerJSON(CUOTAS_PATH);
  const ventaCuotas: any[] = cuotasData[idVenta.toString()];

  if (!ventaCuotas) return res.status(404).json({ mensaje: "No hay cuotas para esta venta." });

  const cuota = ventaCuotas.find((c: any) => c.numero === numeroCuota);
  if (!cuota)       return res.status(404).json({ mensaje: `Cuota #${numeroCuota} no encontrada.` });
  if (cuota.pagada) return res.status(400).json({ mensaje: "Esta cuota ya fue pagada." });

  const vencimiento = new Date(cuota.fechaVencimiento);
  let diasMora = 0;
  if (fechaPago > vencimiento) {
    diasMora = Math.ceil((fechaPago.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));
  }

  const ventasRaw: any[] = leerJSON(VENTAS_PATH);
  const ventaData = ventasRaw.find(v => v.id === idVenta);
  const tasa = ventaData?.tasaInteresDiaria || 0.001;

  const montoInteres = parseFloat((cuota.montoBase * tasa * diasMora).toFixed(2));
  const montoTotal   = parseFloat((cuota.montoBase + montoInteres).toFixed(2));

  cuota.pagada       = true;
  cuota.fechaPago    = fechaPago.toISOString();
  cuota.montoInteres = montoInteres;

  escribirJSON(CUOTAS_PATH, cuotasData);

  const todasPagadas = ventaCuotas.every((c: any) => c.pagada);
  if (todasPagadas) {
    const idx = ventasRaw.findIndex(v => v.id === idVenta);
    if (idx !== -1) {
      ventasRaw[idx].estado = "COMPLETADA";
      escribirJSON(VENTAS_PATH, ventasRaw);
      if (ventaData) actualizarEstadoLote(ventaData.loteId, "VENDIDO");

      // ── GUARDAR EN HISTORIAL AL COMPLETAR ────────
      const lote     = loteRepo.buscarPorId(ventaData.loteId);
      const usuarios = usuarioRepo.obtenerTodos();
      const asesor   = usuarios.find(u => u.getId() === ventaData.asesorId);
      agregarAlHistorial({
        idVenta,
        cliente:      ventaData.cliente?.nombre || "—",
        asesor:       asesor?.getNombre()       || "—",
        fecha:        new Date().toISOString(),
        metodoDePago: ventaData.tipo,
        precioVenta:  lote?.getPrecio()         || 0,
        detalles:     `Financiamiento completado — ${ventaData.numeroCuotas} cuotas pagadas`,
      });
      // ─────────────────────────────────────────────
    }
  }

  return res.json({ mensaje: `Cuota #${numeroCuota} pagada.`, diasMora, montoInteres, montoTotal, ventaCompletada: todasPagadas });
});

// ══════════════════════════════════════════════════════
//  ASESORES  — JEFE
// ══════════════════════════════════════════════════════

app.get("/api/asesores", (_req, res) => {
  const usuarios = usuarioRepo.obtenerTodos();
  res.json(usuarios.filter(u => u.getTipo() === TipoUsuario.ASESOR).map(serializarUsuario));
});

app.post("/api/asesores", (req, res) => {
  const { jefeId, nombre, usuario, contraseña } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede agregar asesores." });

  const { usuarioService } = makeServicios();
  try {
    const asesor = usuarioService.agregarAsesor(jefe, nombre, usuario, contraseña);
    return res.json({ mensaje: "Asesor agregado.", asesor: serializarUsuario(asesor) });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════
//  DESBLOQUEAR USUARIO  — JEFE
// ══════════════════════════════════════════════════════

app.post("/api/usuarios/:id/desbloquear", (req, res) => {
  const idUsuario = Number(req.params.id);
  const { jefeId } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede desbloquear usuarios." });

  const usuarios = usuarioRepo.obtenerTodos();
  const target   = usuarios.find(u => u.getId() === idUsuario);
  if (!target)              return res.status(404).json({ mensaje: "Usuario no encontrado." });
  if (!target.estaBloqueado()) return res.status(400).json({ mensaje: "El usuario no está bloqueado." });

  target.desbloquear();
  return res.json({ mensaje: "Usuario desbloqueado correctamente." });
});

// ══════════════════════════════════════════════════════
//  REPORTES  — JEFE  (lee historial desde archivo)
// ══════════════════════════════════════════════════════

app.get("/api/reportes", (_req, res) => {
  const { reporteService, usuarios } = makeServicios();

  const jefe = usuarios.find(u => u.getTipo() === TipoUsuario.JEFE);
  if (!jefe) return res.status(403).json({ mensaje: "No hay jefe registrado." });

  try {
    const totalVentas     = reporteService.obtenerTotalVentas(jefe);
    const ingresosTotales = reporteService.obtenerIngresosTotales(jefe);
    const asesorTop       = reporteService.obtenerAsesorConMasVentas(jefe);

    // ── LEER HISTORIAL DESDE ARCHIVO ─────────────────
    const historial: any[] = leerHistorial();
    // ─────────────────────────────────────────────────

    return res.json({
      totalVentas,
      ingresosTotales,
      asesorTop: asesorTop ? serializarUsuario(asesorTop) : null,
      historial,   // ya tiene el formato correcto: { idVenta, cliente, asesor, fecha, metodoDePago, precioVenta, detalles }
    });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════
//  CONFIGURACIÓN  — JEFE
// ══════════════════════════════════════════════════════

app.put("/api/config/tasa", (req, res) => {
  const { jefeId, tasa } = req.body;
  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede modificar la tasa." });

  const t = Number(tasa);
  if (isNaN(t) || t < 0 || t > 1)
    return res.status(400).json({ mensaje: "La tasa debe estar entre 0 y 1." });

  const config = leerJSON(CONFIG_PATH);
  config.tasaInteresDiaria = t;
  escribirJSON(CONFIG_PATH, config);
  return res.json({ mensaje: "Tasa de interés actualizada." });
});

app.put("/api/config/penalidad", (req, res) => {
  const { jefeId, penalidad } = req.body;
  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede modificar la penalidad." });

  const p = Number(penalidad);
  if (isNaN(p) || p < 0 || p > 1)
    return res.status(400).json({ mensaje: "La penalidad debe estar entre 0 y 1." });

  const config = leerJSON(CONFIG_PATH);
  config.porcentajePenalidad = p;
  escribirJSON(CONFIG_PATH, config);
  return res.json({ mensaje: "Penalidad actualizada." });
});

app.get("/api/config", (_req, res) => {
  res.json(leerJSON(CONFIG_PATH));
});

// ══════════════════════════════════════════════════════
//  UTILIDAD INTERNA
// ══════════════════════════════════════════════════════

function actualizarEstadoLote(loteId: number, nuevoEstado: string) {
  const LOTES_PATH = path.join(DATA_DIR, "lotes.json");
  const lotes: any[] = leerJSON(LOTES_PATH);
  const idx = lotes.findIndex(l => l.id === loteId);
  if (idx !== -1) {
    lotes[idx].estado = nuevoEstado;
    escribirJSON(LOTES_PATH, lotes);
  }
}

// ══════════════════════════════════════════════════════
//  FRONTEND ESTÁTICO
// ══════════════════════════════════════════════════════

const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath));
app.get("*", (_req, res) => res.sendFile(path.join(publicPath, "index.html")));

// ══════════════════════════════════════════════════════
//  ARRANCAR
// ══════════════════════════════════════════════════════

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`\n🏡  InmoSistema corriendo en http://localhost:${PORT}`);
  console.log(`📁  Datos en: ${DATA_DIR}\n`);
});