import { EstadoLote } from "../enums/EstadoLote";

export class Lote {

    private estado: EstadoLote;

    constructor(
        private idLote: number,
        private lote: string,
        private precio: number
    ) {
        this.estado = EstadoLote.DISPONIBLE;
    }

    // =========================
    // CAMBIOS DE ESTADO
    // =========================

    public reservar(): void {
        if (!this.estaDisponible()) {
            throw new Error("El lote no está disponible para reservar.");
        }
        this.estado = EstadoLote.RESERVADO;
    }

    public activarFinanciamiento(): void {
        if (!this.estaReservado()) {
            throw new Error("Solo un lote reservado puede pasar a financiamiento.");
        }
        this.estado = EstadoLote.EN_FINANCIAMIENTO;
    }

    public vender(): void {
        if (!this.estaReservado() && !this.estaEnFinanciamiento()) {
            throw new Error("El lote no puede venderse en su estado actual.");
        }
        this.estado = EstadoLote.VENDIDO;
    }

    public liberar(): void {
        if (this.estaDisponible()) {
            throw new Error("El lote ya está disponible.");
        }

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

    public getLote(): string {
        return this.lote;
    }

    public getPrecio(): number {
        return this.precio;
    }

    public getEstado(): EstadoLote {
        return this.estado;
    }
}