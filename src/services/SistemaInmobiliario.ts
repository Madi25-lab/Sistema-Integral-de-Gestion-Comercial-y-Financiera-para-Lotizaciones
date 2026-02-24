import { Usuario } from "../models/Usuario";
import { Asesor } from "../models/Asesor";
import { Jefe } from "../models/Jefe";
import { Lote } from "../models/Lote";
import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";
import { TipoDistribucion } from "../enums/TipoDistribucion";
import { Zona } from "../enums/Zona";

export class SistemaInmobiliario {

    // =========================
    // SESIÓN
    // =========================

    private usuarioLogueado: Usuario | null = null;

    // =========================
    // ATRIBUTOS PRINCIPALES
    // =========================

    private usuarios: Usuario[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];

    private contadorAsesores: number = 1;
    private contadorLotes: number = 1;
    private contadorVentas: number = 1;

    private porcentajePenalidad: number = 0.10;

    // =========================
    // TABLA DE PRECIOS
    // =========================

    private precios: Map<Zona, Map<TipoDistribucion, number>> = new Map([
        [Zona.A, new Map([
            [TipoDistribucion.PASAJE, 250],
            [TipoDistribucion.AVENIDA, 350],
            [TipoDistribucion.ESQUINA, 400],
            [TipoDistribucion.FRENTE_PARQUE, 450],
        ])],
        [Zona.B, new Map([
            [TipoDistribucion.PASAJE, 200],
            [TipoDistribucion.AVENIDA, 300],
            [TipoDistribucion.ESQUINA, 350],
            [TipoDistribucion.FRENTE_PARQUE, 380],
        ])],
        [Zona.C, new Map([
            [TipoDistribucion.PASAJE, 150],
            [TipoDistribucion.AVENIDA, 220],
            [TipoDistribucion.ESQUINA, 250],
            [TipoDistribucion.FRENTE_PARQUE, 280],
        ])]
    ]);

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor() {
        const jefe = new Jefe(1, "Administrador", "admin", "1234");
        this.usuarios.push(jefe);
    }

    // =========================
    // LOGIN
    // =========================

    public login(usuario: string, contraseña: string): Usuario {

    const usuarioEncontrado = this.usuarios.find(u =>
        u.validarCredenciales(usuario, contraseña)
    );

    if (!usuarioEncontrado) {
        throw new Error("Credenciales incorrectas.");
    }

    this.usuarioLogueado = usuarioEncontrado;

    return usuarioEncontrado;
}

    public logout(): void {
        this.usuarioLogueado = null;
    }

    private verificarSesion(): void {
        if (!this.usuarioLogueado) {
            throw new Error("Debe iniciar sesión.");
        }
    }

    private verificarJefe(): Jefe {
        this.verificarSesion();

        if (!(this.usuarioLogueado instanceof Jefe)) {
            throw new Error("Acceso restringido solo para el jefe.");
        }

        return this.usuarioLogueado;
    }

    private verificarAsesor(): Asesor {
        this.verificarSesion();

        if (!(this.usuarioLogueado instanceof Asesor)) {
            throw new Error("Acceso restringido solo para asesores.");
        }

        return this.usuarioLogueado;
    }

    // =========================
    // MÉTODOS DEL JEFE
    // =========================

    public actualizarPrecio(
        zona: Zona,
        tipo: TipoDistribucion,
        nuevoPrecio: number
    ): void {

        this.verificarJefe();

        if (nuevoPrecio <= 0) {
            throw new Error("El precio debe ser mayor a cero.");
        }

        const preciosZona = this.precios.get(zona);
        if (!preciosZona) {
            throw new Error("Zona no encontrada.");
        }

        preciosZona.set(tipo, nuevoPrecio);
    }

    public actualizarPorcentajePenalidad(nuevoPorcentaje: number): void {

        this.verificarJefe();

        if (nuevoPorcentaje < 0 || nuevoPorcentaje > 1) {
            throw new Error("El porcentaje debe estar entre 0 y 1.");
        }

        this.porcentajePenalidad = nuevoPorcentaje;
    }

    public registrarAsesor(
        nombre: string,
        usuario: string,
        contraseña: string
    ): Asesor {

        this.verificarJefe();

        const existe = this.usuarios.some(u => u.getUsuario() === usuario);
        if (existe) {
            throw new Error("Ya existe un usuario con ese nombre.");
        }

        const asesor = new Asesor(
            this.contadorAsesores++,
            nombre,
            usuario,
            contraseña
        );

        this.usuarios.push(asesor);
        return asesor;
    }

    // =========================
    // LOTES
    // =========================

    public registrarLote(
        nombre: string,
        tamanio: number,
        ubicacion: string,
        zona: Zona,
        tipo: TipoDistribucion
    ): Lote {

        this.verificarJefe();

        const precioMetro = this.obtenerPrecio(zona, tipo);

        const lote = new Lote(
            this.contadorLotes++,
            nombre,
            tamanio,
            ubicacion,
            zona,
            tipo,
            precioMetro
        );

        this.lotes.push(lote);
        return lote;
    }

    private obtenerPrecio(zona: Zona, tipo: TipoDistribucion): number {

        const preciosZona = this.precios.get(zona);
        if (!preciosZona) {
            throw new Error("Zona no encontrada.");
        }

        const precio = preciosZona.get(tipo);
        if (precio === undefined) {
            throw new Error("Tipo de distribución no válido.");
        }

        return precio;
    }

    private buscarLotePorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }

    // =========================
    // RESERVA
    // =========================

    public reservarLote(loteId: number): void {

        const asesor = this.verificarAsesor();

        const lote = this.buscarLotePorId(loteId);
        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        lote.reservar();
    }

    // =========================
    // VENTAS
    // =========================

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

        const lote = this.buscarLotePorId(loteId);
        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        if (!lote.estaReservado()) {
            throw new Error("El lote debe estar reservado.");
        }

        const venta = new Venta(
            this.contadorVentas++,
            asesor,
            cliente,
            lote,
            tipo,
            numeroCuotas
        );

        this.ventas.push(venta);
        asesor.agregarVenta(venta);

        return venta;
    }

    public anularVenta(idVenta: number): number {

        this.verificarJefe();

        const venta = this.ventas.find(v => v.getIdVenta() === idVenta);
        if (!venta) {
            throw new Error("Venta no encontrada.");
        }

        return venta.anularVenta(this.porcentajePenalidad);
    }
}