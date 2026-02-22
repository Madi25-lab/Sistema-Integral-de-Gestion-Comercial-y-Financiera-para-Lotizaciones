import { EstadoLote } from "../enums/EstadoLote";
import { TipoDistribucion } from "../enums/TipoDistribucion";

export class Lote {

    private estado: EstadoLote;
    private precioFinal: number;

    constructor(
        private idLote: number,
        private nombre: string,
        private tamanio: number,
        private ubicacion: string,
        private tipoDistribucion: TipoDistribucion,
        private precioMetro: number
    ) {

        if (tamanio <= 0) {
            throw new Error("El tamaño debe ser mayor a cero.");
        }

        this.estado = EstadoLote.DISPONIBLE;
        this.precioFinal = this.tamanio * this.precioMetro;
    }

    // =========================
    // ESTADOS
    // =========================

    public reservar(): void {
        if (!this.estaDisponible()) {
            throw new Error("El lote no está disponible.");
        }
        this.estado = EstadoLote.RESERVADO;
    }

    public activarFinanciamiento(): void {
        if (!this.estaReservado()) {
            throw new Error("Solo un lote reservado puede financiarse.");
        }
        this.estado = EstadoLote.EN_FINANCIAMIENTO;
    }

    public vender(): void {
        this.estado = EstadoLote.VENDIDO;
    }

    public liberar(): void {
        this.estado = EstadoLote.DISPONIBLE;
    }

    // =========================
    // VALIDACIONES
    // =========================

    public estaDisponible(): boolean {
        return this.estado === EstadoLote.DISPONIBLE;
    }

    public estaReservado(): boolean {
        return this.estado === EstadoLote.RESERVADO;
    }

    public estaEnFinanciamiento(): boolean {
        return this.estado === EstadoLote.EN_FINANCIAMIENTO;
    }

    public estaVendido(): boolean {
        return this.estado === EstadoLote.VENDIDO;
    }

    // =========================
    // GETTERS
    // =========================

    public getIdLote(): number {
        return this.idLote;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public getTamanio(): number {
        return this.tamanio;
    }

    public getUbicacion(): string {
        return this.ubicacion;
    }

    public getTipoDistribucion(): TipoDistribucion {
        return this.tipoDistribucion;
    }

    public getPrecio(): number {
        return this.precioFinal;
    }
}