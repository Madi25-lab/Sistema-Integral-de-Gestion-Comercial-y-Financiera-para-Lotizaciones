import { Asesor } from "../models/Asesor";
import { Lote } from "../models/Lote";
import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";
import { TipoDistribucion } from "../enums/TipoDistribucion";
import { Zona } from "../enums/Zona";
import { Jefe } from "../models/Jefe";

export class SistemaInmobiliario {

    // =========================
    // ATRIBUTOS PRINCIPALES
    // =========================

    private jefe: Jefe = new Jefe(1, "Administrador", "admin", "1234");
    private asesores: Asesor[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];

    private contadorAsesores: number = 1;
    private contadorLotes: number = 1;
    private contadorVentas: number = 1;

    private porcentajePenalidad: number = 0.10;

    // =========================
    // TABLA DE PRECIOS POR ZONA Y UBICACIÓN
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
    // MÉTODOS ADMINISTRATIVOS
    // =========================

    public actualizarPrecio(
        zona: Zona,
        tipo: TipoDistribucion,
        nuevoPrecio: number
    ): void {

        if (nuevoPrecio <= 0) {
            throw new Error("El precio debe ser mayor a cero.");
        }

        const preciosZona = this.precios.get(zona);
        if (!preciosZona) {
            throw new Error("Zona no encontrada.");
        }

        preciosZona.set(tipo, nuevoPrecio);
    }

    public obtenerPrecio(zona: Zona, tipo: TipoDistribucion): number {

        const preciosZona = this.precios.get(zona);
        if (!preciosZona) {
            throw new Error("Zona no encontrada.");
        }

        const precio = preciosZona.get(tipo);
        if (!precio) {
            throw new Error("Tipo de distribución no válido.");
        }

        return precio;
    }

    public actualizarPorcentajePenalidad(nuevoPorcentaje: number): void {
        if (nuevoPorcentaje < 0 || nuevoPorcentaje > 1) {
            throw new Error("El porcentaje debe estar entre 0 y 1.");
        }
        this.porcentajePenalidad = nuevoPorcentaje;
    }

    // =========================
    // REGISTRO DE ASESOR
    // =========================

    public registrarAsesor(
        nombre: string,
        usuario: string,
        contraseña: string
    ): Asesor {

        const existe = this.asesores.some(a => a.getUsuario() === usuario);
        if (existe) {
            throw new Error("Ya existe un asesor con ese usuario.");
        }

        const asesor = new Asesor(
            this.contadorAsesores++,
            nombre,
            usuario,
            contraseña
        );

        this.asesores.push(asesor);
        return asesor;
    }

    // =========================
    // REGISTRO DE LOTE
    // =========================

    public registrarLote(
        nombre: string,
        tamanio: number,
        ubicacion: string,
        zona: Zona,
        tipo: TipoDistribucion
    ): Lote {

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

    // =========================
    // OPERACIONES DE LOTE
    // =========================

    public reservarLote(loteId: number): void {

        const lote = this.buscarLotePorId(loteId);
        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        if (!lote.estaDisponible()) {
            throw new Error("El lote no está disponible.");
        }

        lote.reservar();
    }

    public buscarLotePorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }

    // =========================
    // VENTAS
    // =========================

    public crearVenta(
        asesorId: number,
        clienteId: number,
        loteId: number,
        tipo: TipoVenta,
        numeroCuotas?: number
    ): Venta {

        const asesor = this.asesores.find(a => a.getId() === asesorId);
        if (!asesor) {
            throw new Error("Asesor no encontrado.");
        }

        const cliente = asesor.buscarClientePorId(clienteId);
        if (!cliente) {
            throw new Error("Cliente no encontrado para este asesor.");
        }

        const lote = this.buscarLotePorId(loteId);
        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        if (!lote.estaReservado()) {
            throw new Error("El lote debe estar reservado antes de generar la venta.");
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

        const venta = this.ventas.find(v => v.getIdVenta() === idVenta);
        if (!venta) {
            throw new Error("Venta no encontrada.");
        }

        return venta.anularVenta(this.porcentajePenalidad);
    }

}