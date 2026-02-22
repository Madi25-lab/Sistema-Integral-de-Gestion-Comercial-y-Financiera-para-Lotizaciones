import { Asesor } from "../models/Asesor";
import { Lote } from "../models/Lote";
import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";
import { TipoDistribucion } from "../enums/TipoDistribucion";

export class SistemaInmobiliario {

    private asesores: Asesor[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];
    private preciosPorUbicacion: Map<TipoDistribucion, number> = new Map([
    [TipoDistribucion.PASAJE, 200],
    [TipoDistribucion.AVENIDA, 300],
    [TipoDistribucion.ESQUINA, 350],
    [TipoDistribucion.FRENTE_PARQUE, 400],
]);

    private contadorAsesores: number = 1;
    private contadorLotes: number = 1;
    private contadorVentas: number = 1;

    // Política global del sistema
    private porcentajePenalidad: number = 0.10; // 10%

    // =========================
    // REGISTRAR ASESOR
    // =========================
    public registrarAsesor( nombre: string, usuario: string, contraseña: string
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
    // REGISTRAR LOTE
    // =========================
    public registrarLote(
    nombre: string,
    tamanio: number,
    ubicacion: string,
    tipoDistribucion: TipoDistribucion
): Lote {

    const precioMetro = this.preciosPorUbicacion.get(tipoDistribucion);

    if (!precioMetro) {
        throw new Error("No existe precio definido para esta ubicación.");
    }

    const lote = new Lote(
        this.contadorLotes++, nombre, tamanio, ubicacion, tipoDistribucion, precioMetro
    );

    this.lotes.push(lote);
    return lote;
}

    // =========================
    // RESERVAR LOTE
    // =============public registrarLote(
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


    // =========================
    // CREAR VENTA
    // =========================
    public crearVenta( asesorId: number, clienteId: number, loteId: number, tipo: TipoVenta, numeroCuotas?: number
    ): Venta {

        const asesor = this.asesores.find(a => a.getId() === asesorId);
        if (!asesor) {
            throw new Error("Asesor no encontrado.");
        }

        const cliente = asesor.buscarClientePorId(clienteId);
        if (!cliente) {
            throw new Error("Cliente no encontrado para este asesor.");
        }

        const lote = this.lotes.find(l => l.getIdLote() === loteId);
        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        if (!lote.estaReservado()) {
            throw new Error("El lote debe estar reservado antes de generar la venta.");
        }

        const venta = new Venta( this.contadorVentas++, asesor, cliente, lote, tipo, numeroCuotas
        );

        this.ventas.push(venta);
        asesor.agregarVenta(venta);

        return venta;
    }

    // =========================
    // ANULAR VENTA
    // =========================
    public anularVenta(idVenta: number): number {

        const venta = this.ventas.find(v => v.getIdVenta() === idVenta);

        if (!venta) {
            throw new Error("Venta no encontrada.");
        }

        return venta.anularVenta(this.porcentajePenalidad);
    }

    // =========================
    // BUSCAR LOTE
    // =========================
    public buscarLotePorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }

    // =========================
    // OPCIONAL: CAMBIAR POLÍTICA DE PENALIDAD
    // =========================
    public actualizarPorcentajePenalidad(nuevoPorcentaje: number): void {

        if (nuevoPorcentaje < 0 || nuevoPorcentaje > 1) {
            throw new Error("El porcentaje debe estar entre 0 y 1.");
        }

        this.porcentajePenalidad = nuevoPorcentaje;
    }

    public getPorcentajePenalidad(): number {
        return this.porcentajePenalidad;
    }
}