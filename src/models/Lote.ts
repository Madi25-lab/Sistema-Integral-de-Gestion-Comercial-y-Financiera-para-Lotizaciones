import { EstadoLote } from "../enums/EstadoLote";

export class Lote {
    private estado: EstadoLote;

    constructor(
        private idLote: number,
        private lote:string,
        private precio: number
    ) {
        this.estado = EstadoLote.DISPONIBLE;
    }

    public reservar(): void {
        if (this.estado !== EstadoLote.DISPONIBLE) {
            throw new Error("El lote no está disponible para reservar.");
        }
        this.estado = EstadoLote.RESERVADO;
    }

    public activarFinanciamiento(): void {
        if (this.estado !== EstadoLote.RESERVADO) {
            throw new Error("Solo un lote reservado puede pasar a financiamiento.");
        }
        this.estado = EstadoLote.EN_FINANCIAMIENTO;
    }

    public vender(): void {
        if (
            this.estado !== EstadoLote.RESERVADO &&
            this.estado !== EstadoLote.EN_FINANCIAMIENTO
        ) {
            throw new Error("El lote no puede venderse en su estado actual.");
        }
        this.estado = EstadoLote.VENDIDO;
    }

    // =========================
    // MÉTODOS DE VALIDACIÓN
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

    public getNLote(): string {
        return this.lote;
    }

    public getPrecio(): number {
        return this.precio;
    }

    public getEstado(): EstadoLote {
        return this.estado;
    }
}