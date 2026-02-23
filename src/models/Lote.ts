import { EstadoLote } from "../enums/EstadoLote";
import { TipoDistribucion } from "../enums/TipoDistribucion";
import { Zona } from "../enums/Zona";

export class Lote {

    private estado: EstadoLote;
    private precioFinal: number;

    constructor(
        private idLote: number,
        private nombre: string,
        private tamanio: number,
        private ubicacion: string,
        private zona: Zona,
        private tipoDistribucion: TipoDistribucion,
        private precioMetro: number
    ) {

        if (tamanio <= 0) {
            throw new Error("El tamaño debe ser mayor a cero.");
        }

        if (precioMetro <= 0) {
            throw new Error("El precio por metro debe ser mayor a cero.");
        }

        this.estado = EstadoLote.DISPONIBLE;
        this.precioFinal = this.tamanio * this.precioMetro;
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

    public getZona(): Zona {
        return this.zona;
    }

    public getTipoDistribucion(): TipoDistribucion {
        return this.tipoDistribucion;
    }

    public getPrecio(): number {
        return this.precioFinal;
    }

    public getTamanio(): number {
        return this.tamanio;
    }

    public getUbicacion(): string {
        return this.ubicacion;
    }

    public getEstado(): EstadoLote {
        return this.estado;
    }

    // =========================
    // CAMBIOS DE ESTADO
    // =========================

    public reservar(): void {
        if (!this.estaDisponible()) {
            throw new Error("El lote no está disponible.");
        }
        this.estado = EstadoLote.RESERVADO;
    }

    public vender(): void {
        if (!this.estaReservado()) {
            throw new Error("El lote debe estar reservado antes de venderse.");
        }
        this.estado = EstadoLote.VENDIDO;
    }

    public liberar(): void {
        this.estado = EstadoLote.DISPONIBLE;
    }

    // =========================
    // VALIDACIONES DE ESTADO
    // =========================

    public estaDisponible(): boolean {
        return this.estado === EstadoLote.DISPONIBLE;
    }

    public estaReservado(): boolean {
        return this.estado === EstadoLote.RESERVADO;
    }

    public estaVendido(): boolean {
        return this.estado === EstadoLote.VENDIDO;
    }
}