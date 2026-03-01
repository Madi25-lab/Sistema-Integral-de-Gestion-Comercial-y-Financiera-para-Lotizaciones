import { Usuario } from "../models/Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";
import { Jefe } from "../models/Jefe";
import { Asesor } from "../models/Asesor";
import { Cliente } from "../models/Cliente";
import { Lote } from "../models/Lote";

import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";
import { ResultadoLogin } from "../interfaces/ResultadoLogin";

export class SistemaInmobiliario {

    private usuarioLogueado: Usuario | null = null;

    private clientes: Cliente[] = [];
    private usuarios: Usuario[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];

    private contadorVentas: number = 1;

    private porcentajePenalidad: number = 0.10;
    private tasaInteresDiariaGlobal: number = 0.001;

    constructor() {
        const jefe = new Jefe(1, "Administrador", "admin", "1234");
        this.usuarios.push(jefe);
    }

    public agregarAsesor(
    nombre: string,
    usuario: string,
    contraseña: string
): Asesor {

    this.verificarJefe();

    // Validar datos básicos
    if (!nombre || nombre.trim() === "") {
        throw new Error("El nombre es obligatorio.");
    }

    if (!usuario || usuario.trim() === "") {
        throw new Error("El usuario es obligatorio.");
    }

    if (!contraseña || contraseña.trim() === "") {
        throw new Error("La contraseña es obligatoria.");
    }

    // ❗ Evitar usuario duplicado
    const existeUsuario = this.usuarios.some(
        u => u.getUsuario() === usuario
    );

    if (existeUsuario) {
        throw new Error("Ya existe un usuario con ese nombre.");
    }

    // Generar nuevo ID automático
    const nuevoId = this.usuarios.length > 0
        ? Math.max(...this.usuarios.map(u => u.getId())) + 1
        : 1;

    const asesor = new Asesor(
        nuevoId,
        nombre,
        usuario,
        contraseña
    );

    this.usuarios.push(asesor);

    return asesor;
}

    // ================= LOGIN =================

    public login(usuario: string, contraseña: string): ResultadoLogin {

    const encontrado = this.usuarios.find(u =>
        u.getUsuario() === usuario
    );

    if (!encontrado) {
        return { exito: false, mensaje: "Usuario no encontrado." };
    }

    if (encontrado.estaBloqueado()) {
        return {
            exito: false,
            mensaje: "Usuario bloqueado. Contacte al jefe."
        };
    }

    const valido = encontrado.validarCredenciales(usuario, contraseña);

    if (!valido) {

        if (encontrado.estaBloqueado()) {
            return {
                exito: false,
                mensaje: "Usuario bloqueado por demasiados intentos."
            };
        }

        return {
            exito: false,
            mensaje: `Credenciales incorrectas. Intentos restantes: ${encontrado.getIntentosRestantes()}`
        };
    }

    this.usuarioLogueado = encontrado;

    return {
        exito: true,
        mensaje: "Login exitoso.",
        usuario: encontrado
    };
    }
    public logout(): void {
        this.usuarioLogueado = null;
    }

    // ================= VALIDACIONES =================

    private verificarSesion(): void {
        if (!this.usuarioLogueado) {
            throw new Error("Debe iniciar sesión.");
        }
    }

    private verificarJefe(): void {

    this.verificarSesion();

    if (!this.usuarioLogueado) {
        throw new Error("No hay sesión activa.");
    }

    if (this.usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
        throw new Error("Acceso solo para jefe.");
    }
}
    
    private verificarAsesor(): Asesor {
        this.verificarSesion();

        if (this.usuarioLogueado!.getTipo() !== TipoUsuario.ASESOR) {
            throw new Error("Acceso solo para asesor.");
        }

        return this.usuarioLogueado as Asesor;
    }

    // ================= MÉTODO DE DESBLOQUEO =================

   public desbloquearUsuario(idUsuario: number): void {

    this.verificarJefe();

    const usuario = this.usuarios.find(u => u.getId() === idUsuario);

    if (!usuario) {
        throw new Error("Usuario no encontrado.");
    }

    if (!usuario.estaBloqueado()) {
        throw new Error("El usuario no está bloqueado.");
    }

    usuario.desbloquear();
}

    // ================= CONFIGURACIÓN =================

    public actualizarTasaInteresGlobal(nuevaTasa: number): void {
        this.verificarJefe();

        if (nuevaTasa < 0 || nuevaTasa > 1) {
            throw new Error("Tasa inválida.");
        }

        this.tasaInteresDiariaGlobal = nuevaTasa;
    }

    public actualizarPorcentajePenalidad(nuevo: number): void {
        this.verificarJefe();

        if (nuevo < 0 || nuevo > 1) {
            throw new Error("Porcentaje inválido.");
        }

        this.porcentajePenalidad = nuevo;
    }

    // ================= VENTAS =================

    public crearVenta(
    clienteId: number,
    loteId: number,
    tipo: TipoVenta,
    numeroCuotas?: number
): Venta {

    const asesor = this.verificarAsesor();

    const cliente = asesor.buscarClientePorId(clienteId);
    if (!cliente) {
        throw new Error("Cliente no encontrado.");
    }

    const lote = this.lotes.find(l => l.getIdLote() === loteId);
    if (!lote) {
        throw new Error("Lote no encontrado.");
    }

    // ✅ SOLO validar disponibilidad (ya no usamos estaVendido)
    if (!lote.estaDisponible()) {
        throw new Error("El lote no está disponible.");
    }

    const venta = new Venta(
        this.contadorVentas++,
        asesor,
        cliente,
        lote,
        tipo,
        this.tasaInteresDiariaGlobal,
        numeroCuotas
    );

    // ✅ Cambiar estado según tipo
    if (tipo === TipoVenta.FINANCIADO) {
        lote.reservar();
        lote.activarFinanciamiento();
    } else {
        lote.reservar();
        lote.vender();
    }

    this.ventas.push(venta);
    asesor.agregarVenta(venta);

    return venta;
}

    public anularVenta(idVenta: number): void {

    const venta = this.ventas.find(v => v.getIdVenta() === idVenta);

    if (!venta) {
        throw new Error("Venta no encontrada.");
    }

    if (venta.estaAnulada()) {
        throw new Error("La venta ya fue anulada.");
    }

    const cliente = venta.getCliente();
    const idCliente = cliente.getId();
    const lote = venta.getLote();

    // ✅ Anular venta
    venta.anularVenta(this.porcentajePenalidad);

    // ✅ Liberar lote
    lote.liberar();

    // ✅ Eliminar venta del sistema
    this.ventas = this.ventas.filter(v => v.getIdVenta() !== idVenta);

    // ✅ Verificar si el cliente tiene otras ventas
    const tieneOtraVenta = this.ventas.some(v =>
        v.getCliente().getId() === idCliente
    );

    if (!tieneOtraVenta) {
        this.clientes = this.clientes.filter(c => c.getId() !== idCliente);
        }
    }
}