import { EstadoLote } from "../enums/EstadoLote";
import { TipoDistribucion } from "../enums/TipoDistribucion";
import { Zona } from "../enums/Zona";

export class Lote {

    private estado: EstadoLote = EstadoLote.DISPONIBLE;

    constructor(
        private idLote: number,
        private nombre: string,
        private tamanio: number,
        private ubicacion: string,
        private zona: Zona,
        private tipoDistribucion: TipoDistribucion,
        private precio: number
    ) {

        if (tamanio <= 0) {
            throw new Error("El tamaño debe ser mayor a cero.");
        }

        if (precio <= 0) {
            throw new Error("El precio debe ser mayor a cero.");
        }

        this.estado = EstadoLote.DISPONIBLE;
    }

    // =========================
    // GETTERS
    // =========================

    public getIdLote(): number { return this.idLote; }

    public getNombre(): string { return this.nombre; }

    public getZona(): Zona { return this.zona; }

    public getTipoDistribucion(): TipoDistribucion { return this.tipoDistribucion; }

    public getPrecio(): number { return this.precio; }

    public getTamanio(): number { return this.tamanio; }

    public getUbicacion(): string { return this.ubicacion; }

    public getEstado(): EstadoLote { return this.estado; }

    // =========================
    // CAMBIOS DE ESTADO
    // =========================

    public reservar(): void {
        if (!this.estaDisponible()) {
            throw new Error("El lote no está disponible.");
        }
        this.estado = EstadoLote.RESERVADO;
    }

    public activarFinanciamiento(): void {
        if (!this.estaReservado()) {
            throw new Error("El lote debe estar reservado para pasar a financiamiento.");
        }
        this.estado = EstadoLote.EN_FINANCIAMIENTO;
    }

    public vender(): void {
        if (!this.estaReservado() && !this.estaEnFinanciamiento()) {
            throw new Error("El lote debe estar reservado o en financiamiento antes de venderse.");
        }
        this.estado = EstadoLote.VENDIDO;
    }

    public liberar(): void {
        if (this.estado === EstadoLote.VENDIDO) {
            throw new Error("No se puede liberar un lote vendido.");
        }
        this.estado = EstadoLote.DISPONIBLE;
    }

    public marcarVendido(): void {
        if (
            this.estado !== EstadoLote.RESERVADO &&
            this.estado !== EstadoLote.EN_FINANCIAMIENTO
        ) {
            throw new Error("Solo un lote reservado o en financiamiento puede venderse.");
        }
        this.estado = EstadoLote.VENDIDO;
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
}