import express from "express";
import path    from "path";
import fs      from "fs";

// ── Repositorios (Infraestructura) ───────────────────────────────────────────
import { UsuarioRepositoryArchivo } from "./Infraestructura/Repositories/UsuarioRepositoryArchivo";
import { LoteRepositoryArchivo }    from "./Infraestructura/Repositories/LoteRepositoryArchivo";
import { VentaRepositoryArchivo }   from "./Infraestructura/Repositories/VentaRepositoryArchivo";

// ── Servicios de Aplicación ──────────────────────────────────────────────────
import { AuthService }    from "./Aplicacion/services/AuthService";
import { UsuarioService } from "./Aplicacion/services/UsuarioService";
import { LoteService }    from "./Aplicacion/services/LoteService";
import { VentaService }   from "./Aplicacion/services/VentaService";
import { ReporteService } from "./Aplicacion/services/ReporteService";

// ── Enums del Dominio ────────────────────────────────────────────────────────
import { TipoUsuario }      from "./Dominio/enums/TipoUsuario";
import { TipoVenta }        from "./Dominio/enums/TipoVenta";
import { Zona }             from "./Dominio/enums/Zona";
import { TipoDistribucion } from "./Dominio/enums/TipoDistribucion";

// ── Modelos del Dominio ──────────────────────────────────────────────────────
import { Asesor }   from "./Dominio/models/Asesor";
import { Jefe }     from "./Dominio/models/Jefe";
import { Cliente }  from "./Dominio/models/Cliente";
import { PlanPago } from "./Dominio/models/PlanPago";

const app = express();
app.use(express.json());

// ══════════════════════════════════════════════════════════════════════════════
//  RUTAS DE ARCHIVOS  (Capa Infraestructura → Data)
// ══════════════════════════════════════════════════════════════════════════════

const DATA_DIR       = path.resolve("src/Infraestructura/Data");
const CLIENTES_PATH  = path.join(DATA_DIR, "clientes.json");
const CUOTAS_PATH    = path.join(DATA_DIR, "cuotas.json");
const VENTAS_PATH    = path.join(DATA_DIR, "ventas.json");
const LOTES_PATH     = path.join(DATA_DIR, "lotes.json");
const HISTORIAL_PATH = path.join(DATA_DIR, "historial.json");
const CONFIG_PATH    = path.join(DATA_DIR, "config.json");

// Garantizar que existan los archivos opcionales
if (!fs.existsSync(CLIENTES_PATH))  fs.writeFileSync(CLIENTES_PATH,  "[]");
if (!fs.existsSync(CUOTAS_PATH))    fs.writeFileSync(CUOTAS_PATH,    "{}");
if (!fs.existsSync(HISTORIAL_PATH)) fs.writeFileSync(HISTORIAL_PATH, "[]");
if (!fs.existsSync(CONFIG_PATH))
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ tasaInteresDiaria: 0.001, porcentajePenalidad: 0.10 }, null, 2));

// Helpers de I/O — capa Infraestructura
const leerJSON     = (r: string): any     => JSON.parse(fs.readFileSync(r, "utf-8"));
const escribirJSON = (r: string, d: any): void => fs.writeFileSync(r, JSON.stringify(d, null, 2));
const getConfig    = ()                   => leerJSON(CONFIG_PATH);

// ══════════════════════════════════════════════════════════════════════════════
//  REPOSITORIOS  (Infraestructura — instancias únicas, leen del disco en cada llamada)
// ══════════════════════════════════════════════════════════════════════════════

const usuarioRepo = new UsuarioRepositoryArchivo();
const loteRepo    = new LoteRepositoryArchivo();
const ventaRepo   = new VentaRepositoryArchivo(usuarioRepo, loteRepo);

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS DE DOMINIO
// ══════════════════════════════════════════════════════════════════════════════

const serU = (u: any) => ({
  id:        u.getId(),
  nombre:    u.getNombre(),
  usuario:   u.getUsuario(),
  tipo:      u.getTipo(),
  bloqueado: u.estaBloqueado(),
});

/**
 * Devuelve un Asesor hidratado con sus clientes desde clientes.json.
 * Necesario porque Asesor.clientes[] es privado y sólo se llena
 * con registrarCliente() o inyectando directamente (para reconstrucción).
 */
function getAsesor(asesorId: number): Asesor | null {
  const u = usuarioRepo.obtenerTodos().find(x => x.getId() === asesorId);
  if (!u || u.getTipo() !== TipoUsuario.ASESOR) return null;
  const asesor = u as Asesor;

  // Inyectar clientes persistidos SIN re-validar duplicados
  const raw: any[] = leerJSON(CLIENTES_PATH);
  raw.filter(c => c.asesorId === asesorId).forEach(c => {
    try {
      const cl = new Cliente(c.id, c.nombre, c.dni, c.telefono, c.direccion);
      (asesor as any).clientes.push(cl);
      if (c.id >= (asesor as any).contadorClientes)
        (asesor as any).contadorClientes = c.id + 1;
    } catch (_) {}
  });

  return asesor;
}

function getJefe(jefeId: number): Jefe | null {
  const u = usuarioRepo.obtenerTodos().find(x => x.getId() === jefeId);
  if (!u || u.getTipo() !== TipoUsuario.JEFE) return null;
  return u as Jefe;
}

/** Actualiza el estado de un lote directamente en lotes.json */
function actualizarEstadoLote(loteId: number, nuevoEstado: string): void {
  const lotes: any[] = leerJSON(LOTES_PATH);
  const idx = lotes.findIndex(l => l.id === loteId);
  if (idx !== -1) { lotes[idx].estado = nuevoEstado; escribirJSON(LOTES_PATH, lotes); }
}

/** Agrega una entrada al historial.json (VentaHistorica persistida) */
function agregarAlHistorial(entrada: {
  idVenta: number; cliente: string; asesor: string;
  fecha: string; metodoDePago: string; precioVenta: number; detalles: string;
}): void {
  const h: any[] = leerJSON(HISTORIAL_PATH);
  h.push(entrada);
  escribirJSON(HISTORIAL_PATH, h);
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. AUTH  →  AuthService (Capa Aplicación) → Usuario.validarCredenciales (Dominio)
// ══════════════════════════════════════════════════════════════════════════════

app.post("/api/login", (req, res) => {
  const { usuario, contraseña } = req.body;
  if (!usuario || !contraseña)
    return res.status(400).json({ exito: false, mensaje: "Completa todos los campos." });

  // Instancia fresca — lee usuarios.json vía UsuarioRepositoryArchivo.obtenerTodos()
  const auth = new AuthService(usuarioRepo.obtenerTodos());       // ← AuthService
  const r    = auth.login(usuario, contraseña);                   // ← AuthService.login()

  if (!r.exito || !r.usuario)
    return res.status(401).json({ exito: false, mensaje: r.mensaje });

  return res.json({ exito: true, mensaje: r.mensaje, usuario: serU(r.usuario) });
});

// ══════════════════════════════════════════════════════════════════════════════
//  2. LOTES  →  LoteService (Aplicación) → LoteRepositoryArchivo (Infraestructura)
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/lotes", (_req, res) => {
  res.json(loteRepo.obtenerTodos().map(l => ({   // ← LoteRepositoryArchivo.obtenerTodos()
    id: l.getIdLote(), nombre: l.getNombre(), tamanio: l.getTamanio(),
    ubicacion: l.getUbicacion(), zona: l.getZona(),
    tipoDistribucion: l.getTipoDistribucion(),
    precio: l.getPrecio(), estado: l.getEstado(),
  })));
});

app.post("/api/lotes", (req, res) => {
  const { jefeId, nombre, tamanio, ubicacion, zona, tipoDistribucion, precio } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede registrar lotes." });

  // LoteService necesita la lista actual para el contador y evitar duplicados
  const svc = new LoteService(loteRepo.obtenerTodos());           // ← LoteService
  try {
    const lote = svc.registrarLote(                               // ← LoteService.registrarLote()
      jefe, String(nombre), Number(tamanio), String(ubicacion),
      zona as Zona, tipoDistribucion as TipoDistribucion, Number(precio)
    );
    loteRepo.guardar(lote);                                       // ← LoteRepositoryArchivo.guardar()
    return res.json({
      mensaje: "Lote registrado correctamente.",
      lote: { id: lote.getIdLote(), nombre: lote.getNombre(), precio: lote.getPrecio(), estado: lote.getEstado() }
    });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ── PUT editar lote  →  LoteRepositoryArchivo.actualizar() ──
app.put("/api/lotes/:id", (req, res) => {
  const id = Number(req.params.id);
  const { jefeId, nombre, tamanio, ubicacion, zona, tipoDistribucion, precio } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede editar lotes." });

  const lote = loteRepo.buscarPorId(id);
  if (!lote) return res.status(404).json({ mensaje: "Lote no encontrado." });

  // No permitir editar lotes con ventas activas
  const ventasActivas = (leerJSON(VENTAS_PATH) as any[])
    .filter(v => v.loteId === id && v.estado !== "ANULADA");
  if (ventasActivas.length > 0)
    return res.status(400).json({ mensaje: "No se puede editar un lote con ventas activas." });

  try {
    loteRepo.actualizar(id, {
      nombre:           String(nombre),
      tamanio:          Number(tamanio),
      ubicacion:        String(ubicacion),
      zona:             String(zona),
      tipoDistribucion: String(tipoDistribucion),
      precio:           Number(precio),
    });
    return res.json({ mensaje: "Lote actualizado correctamente." });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ── DELETE eliminar lote  →  LoteRepositoryArchivo.eliminar() ──
app.delete("/api/lotes/:id", (req, res) => {
  const id = Number(req.params.id);
  const { jefeId } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede eliminar lotes." });

  const lote = loteRepo.buscarPorId(id);
  if (!lote) return res.status(404).json({ mensaje: "Lote no encontrado." });

  if (lote.getEstado() !== "DISPONIBLE")
    return res.status(400).json({ mensaje: "Solo se pueden eliminar lotes DISPONIBLES." });

  try {
    loteRepo.eliminar(id);
    return res.json({ mensaje: "Lote eliminado correctamente." });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  3. CLIENTES  →  Asesor.registrarCliente (Dominio) → clientes.json (Infraestructura)
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/clientes", (req, res) => {
  const asesorId = Number(req.query.asesorId);
  if (!asesorId) return res.status(400).json({ mensaje: "asesorId requerido." });
  res.json((leerJSON(CLIENTES_PATH) as any[]).filter(c => c.asesorId === asesorId));
});

app.post("/api/clientes", (req, res) => {
  const { asesorId, nombre, dni, telefono, direccion } = req.body;

  const asesor = getAsesor(Number(asesorId));
  if (!asesor) return res.status(403).json({ mensaje: "Asesor no encontrado." });

  try {
    // Asesor.registrarCliente() valida: DNI 8 dígitos, teléfono 9 dígitos,
    // nombre/dirección obligatorios y que no exista duplicado en su lista
    const cl = asesor.registrarCliente(                           // ← Asesor.registrarCliente()
      String(nombre), String(dni), String(telefono), String(direccion)
    );

    // Persistir en clientes.json (Infraestructura)
    const todos: any[] = leerJSON(CLIENTES_PATH);
    const nuevoId = todos.length > 0 ? Math.max(...todos.map(c => c.id)) + 1 : 1;
    const dato = {
      id: nuevoId, asesorId: Number(asesorId),
      nombre: cl.getNombre(), dni: cl.getDni(),
      telefono: cl.getTelefono(), direccion: cl.getDireccion(),
    };
    todos.push(dato);
    escribirJSON(CLIENTES_PATH, todos);
    return res.json({ mensaje: "Cliente registrado.", cliente: dato });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  4. VENTAS  (GET todas y por asesor — sin pasar por VentaService, solo lectura)
// ══════════════════════════════════════════════════════════════════════════════

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

// ── POST crear venta  →  VentaService.crearVenta() (Aplicación) ─────────────
app.post("/api/ventas", (req, res) => {
  const { asesorId, clienteId, loteId, tipo, numeroCuotas } = req.body;

  // Asesor hidratado con sus clientes desde clientes.json
  const asesor = getAsesor(Number(asesorId));
  if (!asesor) return res.status(403).json({ mensaje: "Asesor no encontrado." });

  // Asesor.buscarClientePorId() — Capa Dominio
  const cliente = asesor.buscarClientePorId(Number(clienteId));
  if (!cliente) return res.status(400).json({ mensaje: "Cliente no encontrado para este asesor." });

  const lote = loteRepo.buscarPorId(Number(loteId));
  if (!lote)               return res.status(400).json({ mensaje: "Lote no encontrado." });
  if (!lote.estaDisponible()) return res.status(400).json({ mensaje: "El lote no está disponible." });

  if (tipo === "FINANCIADO" && (!numeroCuotas || Number(numeroCuotas) < 1))
    return res.status(400).json({ mensaje: "Debes indicar un número de cuotas válido (mínimo 1)." });

  try {
    const tipoVenta = tipo === "FINANCIADO" ? TipoVenta.FINANCIADO : TipoVenta.CONTADO;
    const cfg       = getConfig();                                // leer config.json fresco
    const tasa      = cfg.tasaInteresDiaria ?? 0.001;

    // VentaService.crearVenta() ← Capa Aplicación
    // Internamente: verificarAsesor() → Asesor.buscarClientePorId() →
    //               Lote.estaDisponible() → Lote.reservar() → new Venta() →
    //               PlanPago (si FINANCIADO) → VentaHistorica
    const ventasSvc = new VentaService([], [lote], [], tasa, cfg.porcentajePenalidad ?? 0.10);
    const venta     = ventasSvc.crearVenta(asesor, Number(clienteId), Number(loteId), tipoVenta, Number(numeroCuotas) || undefined);

    // Venta al contado: pasar de RESERVADO a VENDIDO
    if (tipoVenta === TipoVenta.CONTADO) lote.vender();           // ← Lote.vender() (Dominio)

    // ── Persistencia (Infraestructura) ──────────────────────────────────────
    const ventasRaw: any[] = leerJSON(VENTAS_PATH);
    const nuevoId = ventasRaw.length > 0 ? Math.max(...ventasRaw.map((v: any) => v.id)) + 1 : 1;
    const plan    = venta.getPlanPago();

    const nuevaVenta: any = {
      id:                nuevoId,
      cliente: {
        id:        cliente.getId(),    nombre:    cliente.getNombre(),
        dni:       cliente.getDni(),   telefono:  cliente.getTelefono(),
        direccion: cliente.getDireccion(),
      },
      asesorId:          asesor.getId(),
      loteId:            lote.getIdLote(),
      tipo:              tipoVenta,
      tasaInteresDiaria: tasa,
      numeroCuotas:      plan ? plan.getNumeroCuotas() : 0,
      fecha:             new Date().toISOString(),
      estado:            tipoVenta === TipoVenta.CONTADO ? "COMPLETADA" : "ACTIVA",
    };
    ventasRaw.push(nuevaVenta);
    escribirJSON(VENTAS_PATH, ventasRaw);                          // ← ventas.json

    // Actualizar estado lote en lotes.json
    actualizarEstadoLote(lote.getIdLote(), lote.getEstado());      // RESERVADO o VENDIDO

    // Si FINANCIADO → guardar cuotas generadas por PlanPago (Dominio)
    if (tipoVenta === TipoVenta.FINANCIADO && plan) {
      const cuotasData: any = leerJSON(CUOTAS_PATH);
      cuotasData[nuevoId.toString()] = plan.getCuotas().map(c => ({  // ← PlanPago.getCuotas()
        numero:           c.getNumero(),
        montoBase:        c.getMontoBase(),
        fechaVencimiento: c.getFechaVencimiento().toISOString(),
        pagada:           false,
        montoInteres:     0,
        fechaPago:        null,
      }));
      escribirJSON(CUOTAS_PATH, cuotasData);                       // ← cuotas.json

      // Lote en financiamiento
      actualizarEstadoLote(lote.getIdLote(), "EN_FINANCIAMIENTO");
    }

    // VentaHistorica — solo registrar en historial si es CONTADO (pago inmediato = completada)
    // Las FINANCIADAS se registran cuando se paga la última cuota
    if (tipoVenta === TipoVenta.CONTADO) {
      agregarAlHistorial({
        idVenta:      nuevoId,
        cliente:      cliente.getNombre(),
        asesor:       asesor.getNombre(),
        fecha:        new Date().toISOString(),
        metodoDePago: "CONTADO",
        precioVenta:  lote.getPrecio(),
        detalles:     "Venta al contado — Pago completado",
      });
    }

    return res.json({
      mensaje: "Venta registrada correctamente.",
      venta: {
        idVenta: nuevoId, cliente: nuevaVenta.cliente,
        lote: { id: lote.getIdLote(), nombre: lote.getNombre() },
        tipo: nuevaVenta.tipo, numeroCuotas: nuevaVenta.numeroCuotas,
        total: lote.getPrecio(), estado: nuevaVenta.estado, fecha: nuevaVenta.fecha,
      }
    });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ── DELETE anular venta  →  Venta.anularVenta() + Lote.liberar() (Dominio) ──
app.delete("/api/ventas/:id", (req, res) => {
  const idVenta     = Number(req.params.id);
  const ventasRaw: any[] = leerJSON(VENTAS_PATH);
  const idx         = ventasRaw.findIndex(v => v.id === idVenta);

  if (idx === -1) return res.status(404).json({ mensaje: "Venta no encontrada." });

  const vd = ventasRaw[idx];
  if (vd.estado === "ANULADA")    return res.status(400).json({ mensaje: "La venta ya está anulada." });
  if (vd.estado === "COMPLETADA") return res.status(400).json({ mensaje: "No se puede anular una venta completada." });

  const lote   = loteRepo.buscarPorId(vd.loteId);
  const cfg    = getConfig();
  const pct    = cfg.porcentajePenalidad ?? 0.10;
  // Penalidad.getMonto() = precio * porcentaje  ← lógica de Penalidad (Dominio)
  const penalidad = lote ? parseFloat((lote.getPrecio() * pct).toFixed(2)) : 0;

  // Marcar anulada en archivo
  ventasRaw[idx].estado = "ANULADA";
  escribirJSON(VENTAS_PATH, ventasRaw);                            // ← ventas.json

  // Lote.liberar() → vuelve a DISPONIBLE
  if (lote) actualizarEstadoLote(lote.getIdLote(), "DISPONIBLE"); // ← lotes.json

  // Eliminar cuotas
  const cuotas: any = leerJSON(CUOTAS_PATH);
  delete cuotas[idVenta.toString()];
  escribirJSON(CUOTAS_PATH, cuotas);                               // ← cuotas.json

  // Las ventas anuladas NO se registran en historial — historial es solo de completadas

  return res.json({ mensaje: "Venta anulada. Penalidad aplicada.", penalidad });
});

// ══════════════════════════════════════════════════════════════════════════════
//  5. CUOTAS  →  PlanPago (Dominio) + Cuota.pagar() (Dominio) + cuotas.json
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/ventas/:id/cuotas", (req, res) => {
  const idVenta         = Number(req.params.id);
  const cuotasData: any = leerJSON(CUOTAS_PATH);
  let vc                = cuotasData[idVenta.toString()];

  if (!vc) {
    // Reconstruir plan desde el dominio si no existe en archivo
    const ventasRaw: any[] = leerJSON(VENTAS_PATH);
    const vd               = ventasRaw.find(v => v.id === idVenta);
    if (!vd)                      return res.status(404).json({ mensaje: "Venta no encontrada." });
    if (vd.tipo !== "FINANCIADO") return res.status(400).json({ mensaje: "La venta no es financiada." });
    const lote = loteRepo.buscarPorId(vd.loteId);
    if (!lote) return res.status(404).json({ mensaje: "Lote no encontrado." });

    // new PlanPago() ← Dominio: genera cuotas con fechas mensuales
    const plan = new PlanPago(lote.getPrecio(), vd.numeroCuotas, vd.tasaInteresDiaria || 0.001);
    vc = plan.getCuotas().map(c => ({
      numero:           c.getNumero(),
      montoBase:        c.getMontoBase(),
      fechaVencimiento: c.getFechaVencimiento().toISOString(),
      pagada:           false,
      montoInteres:     0,
      fechaPago:        null,
    }));
    cuotasData[idVenta.toString()] = vc;
    escribirJSON(CUOTAS_PATH, cuotasData);
  }

  const pagadas    = vc.filter((c: any) =>  c.pagada).length;
  const pendientes = vc.filter((c: any) => !c.pagada).length;
  return res.json({ ventaId: idVenta, totalCuotas: vc.length, pagadas, pendientes, cuotas: vc });
});

app.post("/api/ventas/:id/cuotas/:numero/pagar", (req, res) => {
  const idVenta     = Number(req.params.id);
  const numeroCuota = Number(req.params.numero);
  const fechaPago   = new Date(req.body.fechaPago || new Date());

  const cuotasData: any    = leerJSON(CUOTAS_PATH);
  const vc: any[]          = cuotasData[idVenta.toString()];
  if (!vc)         return res.status(404).json({ mensaje: "No hay cuotas para esta venta." });
  const cuota = vc.find((c: any) => c.numero === numeroCuota);
  if (!cuota)      return res.status(404).json({ mensaje: `Cuota #${numeroCuota} no encontrada.` });
  if (cuota.pagada) return res.status(400).json({ mensaje: "Esta cuota ya fue pagada." });

  // Cuota.pagar() — fórmula del dominio:  montoInteres = montoBase * tasaDiaria * diasMora
  const vencimiento = new Date(cuota.fechaVencimiento);
  let diasMora = 0;
  if (fechaPago > vencimiento)
    diasMora = Math.ceil((fechaPago.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));

  const ventasRaw: any[] = leerJSON(VENTAS_PATH);
  const vd               = ventasRaw.find(v => v.id === idVenta);
  const tasa             = vd?.tasaInteresDiaria || getConfig().tasaInteresDiaria || 0.001;

  const montoInteres = parseFloat((cuota.montoBase * tasa * diasMora).toFixed(2));
  const montoTotal   = parseFloat((cuota.montoBase + montoInteres).toFixed(2));

  cuota.pagada       = true;
  cuota.fechaPago    = fechaPago.toISOString();
  cuota.montoInteres = montoInteres;
  escribirJSON(CUOTAS_PATH, cuotasData);                           // ← cuotas.json

  // PlanPago.estaCompletamentePagado() → si todas pagadas → COMPLETADA + lote VENDIDO
  const todasPagadas = vc.every((c: any) => c.pagada);
  if (todasPagadas) {
    const i = ventasRaw.findIndex(v => v.id === idVenta);
    if (i !== -1) {
      ventasRaw[i].estado = "COMPLETADA";
      escribirJSON(VENTAS_PATH, ventasRaw);                        // ← ventas.json
      if (vd) actualizarEstadoLote(vd.loteId, "VENDIDO");         // ← lotes.json

      // Historial de completado
      const lote     = vd ? loteRepo.buscarPorId(vd.loteId) : null;
      const usuarios = usuarioRepo.obtenerTodos();
      const asesor   = usuarios.find(u => u.getId() === vd?.asesorId);
      agregarAlHistorial({
        idVenta,
        cliente:      vd?.cliente?.nombre || "—",
        asesor:       asesor?.getNombre() || "—",
        fecha:        new Date().toISOString(),
        metodoDePago: vd?.tipo || "FINANCIADO",
        precioVenta:  lote?.getPrecio() || 0,
        detalles:     `Financiamiento completado — ${vd?.numeroCuotas || "?"} cuotas pagadas`,
      });
    }
  }

  return res.json({ mensaje: `Cuota #${numeroCuota} pagada.`, diasMora, montoInteres, montoTotal, ventaCompletada: todasPagadas });
});

// ══════════════════════════════════════════════════════════════════════════════
//  6. ASESORES  →  UsuarioService (Aplicación) + UsuarioRepositoryArchivo
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/asesores", (_req, res) => {
  res.json(
    usuarioRepo.obtenerTodos()
      .filter(u => u.getTipo() === TipoUsuario.ASESOR)
      .map(serU)
  );
});

app.post("/api/asesores", (req, res) => {
  const { jefeId, nombre, usuario, contraseña } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede agregar asesores." });

  // UsuarioService.agregarAsesor() ← Capa Aplicación
  // valida campos, evita duplicados, genera ID, persiste via usuarioRepo
  const svc = new UsuarioService(usuarioRepo.obtenerTodos(), usuarioRepo);
  try {
    const asesor = svc.agregarAsesor(jefe, nombre, usuario, contraseña);
    return res.json({ mensaje: "Asesor agregado.", asesor: serU(asesor) });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  7. DESBLOQUEAR  →  Usuario.desbloquear() (Dominio)
// ══════════════════════════════════════════════════════════════════════════════

app.post("/api/usuarios/:id/desbloquear", (req, res) => {
  const idUsuario = Number(req.params.id);
  const { jefeId } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede desbloquear usuarios." });

  const target = usuarioRepo.obtenerTodos().find(u => u.getId() === idUsuario);
  if (!target)                  return res.status(404).json({ mensaje: "Usuario no encontrado." });
  if (!target.estaBloqueado())  return res.status(400).json({ mensaje: "El usuario no está bloqueado." });

  target.desbloquear();   // ← Usuario.desbloquear() (Dominio) — resetea intentosFallidos y bloqueado
  return res.json({ mensaje: "Usuario desbloqueado correctamente." });
});

// ── DELETE eliminar asesor  →  UsuarioRepositoryArchivo.eliminar() ──
app.delete("/api/asesores/:id", (req, res) => {
  const id = Number(req.params.id);
  const { jefeId } = req.body;

  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede eliminar asesores." });

  const usuarios = usuarioRepo.obtenerTodos();
  const asesor   = usuarios.find(u => u.getId() === id);
  if (!asesor) return res.status(404).json({ mensaje: "Asesor no encontrado." });
  if (asesor.getTipo() !== TipoUsuario.ASESOR)
    return res.status(400).json({ mensaje: "Solo se pueden eliminar asesores." });

  // Verificar que no tenga ventas activas
  const ventasActivas = (leerJSON(VENTAS_PATH) as any[])
    .filter(v => v.asesorId === id && v.estado !== "ANULADA");
  if (ventasActivas.length > 0)
    return res.status(400).json({ mensaje: "No se puede eliminar un asesor con ventas activas o completadas." });

  try {
    usuarioRepo.eliminar(id);
    return res.json({ mensaje: "Asesor eliminado correctamente." });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  8. REPORTES  →  ReporteService (Aplicación) + historial.json
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/reportes", (_req, res) => {
  const usuarios = usuarioRepo.obtenerTodos();
  const jefe     = usuarios.find(u => u.getTipo() === TipoUsuario.JEFE);
  if (!jefe) return res.status(403).json({ mensaje: "No hay jefe registrado." });

  // CORRECCIÓN CRÍTICA: ReporteService.obtenerIngresosTotales() llama a
  // venta.estaCompletamentePagada() y venta.getTotal() que requieren métodos reales.
  // Venta.reconstruirDesdeJSON() sólo hace Object.assign, por lo que esos métodos
  // funcionan correctamente al tener el prototipo correcto.
  const ventas   = ventaRepo.obtenerTodos();  // ← VentaRepositoryArchivo.obtenerTodos()
  const asesores = usuarios.filter(u => u.getTipo() === TipoUsuario.ASESOR);

  const svc = new ReporteService(ventas, asesores);               // ← ReporteService
  try {
    const totalVentas     = svc.obtenerTotalVentas(jefe);          // ← ReporteService
    const ingresosTotales = svc.obtenerIngresosTotales(jefe);      // ← ReporteService
    const asesorTop       = svc.obtenerAsesorConMasVentas(jefe);   // ← ReporteService

    // Historial desde archivo (VentaHistorica persistida)
    const historial: any[] = leerJSON(HISTORIAL_PATH);

    // Calcular stats propias del asesor top
    let asesorTopData = null;
    if (asesorTop) {
      const ventasDelTop = ventas.filter(v =>
        v.getAsesor().getId() === asesorTop.getId() &&
        v.getEstado() !== "ANULADA"
      );
      const ingresosTop = ventasDelTop
        .filter(v => v.estaCompletamentePagada())
        .reduce((s, v) => s + v.getTotal(), 0);
      asesorTopData = {
        ...serU(asesorTop),
        totalVentas: ventasDelTop.length,
        ingresos:    ingresosTop,
      };
    }

    // Historial: si historial.json está vacío, generarlo desde ventas.json
    // Historial: si historial.json está vacío, generarlo solo de ventas COMPLETADAS
    const historialFinal = historial.length > 0 ? historial :
      (leerJSON(VENTAS_PATH) as any[])
        .filter(v => v.estado === "COMPLETADA")
        .map(v => {
          const asesorH = usuarioRepo.obtenerTodos().find(u => u.getId() === v.asesorId);
          const loteH   = loteRepo.buscarPorId(v.loteId);
          return {
            idVenta:      v.id,
            cliente:      v.cliente?.nombre || "—",
            asesor:       asesorH?.getNombre() || "—",
            fecha:        v.fecha,
            metodoDePago: v.tipo,
            precioVenta:  loteH?.getPrecio() || 0,
            detalles:     v.tipo === "FINANCIADO"
              ? `Financiamiento completado — ${v.numeroCuotas} cuotas pagadas`
              : "Venta al contado — Pago completado",
          };
        });

    return res.json({
      totalVentas,
      ingresosTotales,
      asesorTop: asesorTopData,
      historial: historialFinal,
    });
  } catch (e: any) { return res.status(400).json({ mensaje: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  9. CONFIGURACIÓN  →  Jefe (Dominio - permiso) + config.json (Infraestructura)
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/config", (_req, res) => res.json(getConfig()));

app.put("/api/config/tasa", (req, res) => {
  const { jefeId, tasa } = req.body;
  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede modificar la tasa." });

  const t = Number(tasa);
  if (isNaN(t) || t < 0 || t > 1)
    return res.status(400).json({ mensaje: "La tasa debe estar entre 0 y 1 (ej: 0.001)." });

  const cfg = getConfig();
  cfg.tasaInteresDiaria = t;
  escribirJSON(CONFIG_PATH, cfg);                                  // ← config.json
  return res.json({ mensaje: "Tasa de interés actualizada.", tasaInteresDiaria: t });
});

app.put("/api/config/penalidad", (req, res) => {
  const { jefeId, penalidad } = req.body;
  const jefe = getJefe(Number(jefeId));
  if (!jefe) return res.status(403).json({ mensaje: "Solo el jefe puede modificar la penalidad." });

  const p = Number(penalidad);
  if (isNaN(p) || p < 0 || p > 1)
    return res.status(400).json({ mensaje: "La penalidad debe estar entre 0 y 1 (ej: 0.10)." });

  const cfg = getConfig();
  cfg.porcentajePenalidad = p;
  escribirJSON(CONFIG_PATH, cfg);                                  // ← config.json
  return res.json({ mensaje: "Penalidad actualizada.", porcentajePenalidad: p });
});

// ══════════════════════════════════════════════════════════════════════════════
//  FRONTEND ESTÁTICO
// ══════════════════════════════════════════════════════════════════════════════

const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath));
app.get("*", (_req, res) => res.sendFile(path.join(publicPath, "index.html")));

// ══════════════════════════════════════════════════════════════════════════════
//  ARRANCAR
// ══════════════════════════════════════════════════════════════════════════════

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`\n🏡  InmoSistema corriendo en http://localhost:${PORT}`);
  console.log(`📁  Datos en: ${DATA_DIR}\n`);
  console.log("  Capas activas:");
  console.log("  ✓ Dominio      — modelos, enums, reglas de negocio");
  console.log("  ✓ Aplicación   — AuthService, LoteService, VentaService, ReporteService, UsuarioService");
  console.log("  ✓ Infraestructura — Repositorios JSON + Data files");
  console.log("  ✓ Interfaz     — REST API + HTML/CSS/JS\n");
});