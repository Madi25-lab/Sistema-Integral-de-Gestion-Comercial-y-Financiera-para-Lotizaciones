import { Asesor } from "./Asesor";
import { Cliente } from "./Cliente";
import { Lote } from "./Lote";
import { TipoVenta } from "../enums/TipoVenta";
import { PlanPago } from "./PlanPago";
import { EstadoVenta } from "../enums/EstadoVenta";
import { Penalidad } from "./Penalidad";

export class Venta {

    private planPago: PlanPago | null = null;
    private estado: EstadoVenta;
    private penalidad: Penalidad | null = null;

    constructor(
        private idVenta: number,
        private asesor: Asesor,
        private cliente: Cliente,
        private lote: Lote,
        private tipo: TipoVenta,
        private tasaInteresDiaria: number,
        numeroCuotas?: number
    ) {

        if (!lote.estaReservado()) {
            throw new Error("El lote debe estar reservado.");
        }

        this.estado = EstadoVenta.ACTIVA;

        if (tipo === TipoVenta.CONTADO) {
            this.lote.vender();
            this.estado = EstadoVenta.COMPLETADA;
        } else {

            if (!numeroCuotas || numeroCuotas <= 0) {
                throw new Error("Número de cuotas inválido.");
            }

            this.lote.activarFinanciamiento();

            this.planPago = new PlanPago(
                lote.getPrecio(),
                numeroCuotas,
                this.tasaInteresDiaria
            );
        }
    }

    public pagarCuota(numero: number, fechaPago: Date): void {

        if (this.estado !== EstadoVenta.ACTIVA) {
            throw new Error("Venta no activa.");
        }

        if (!this.planPago) {
            throw new Error("No es venta financiada.");
        }

        this.planPago.pagarCuota(numero, fechaPago);

        if (this.planPago.estaCompletamentePagado()) {
            this.lote.vender();
            this.estado = EstadoVenta.COMPLETADA;
        }
    }

    public anularVenta(porcentajePenalidad: number): number {

        if (this.estado !== EstadoVenta.ACTIVA) {
            throw new Error("Solo se puede anular venta activa.");
        }

        if (!this.planPago) {
            throw new Error("No existe plan de pago.");
        }

        const totalPagado = this.planPago.obtenerTotalPagado();

        this.penalidad = new Penalidad(
            porcentajePenalidad,
            this.lote.getPrecio(),
            totalPagado
        );

        const devolucion = this.penalidad.getDevolucion();

        this.estado = EstadoVenta.ANULADA;
        this.lote.liberar();
        this.planPago = null;

        return devolucion;
    }

    public estaAnulada(): boolean {
    return this.estado === EstadoVenta.ANULADA;
}

    // =========================
    // GETTERS
    // =========================

    public getIdVenta(): number { return this.idVenta; }
    public getAsesor(): Asesor { return this.asesor; }
    public getCliente(): Cliente { return this.cliente; }
    public getLote(): Lote { return this.lote; }
    public getTipo(): TipoVenta { return this.tipo; }
    public getPlanPago(): PlanPago | null { return this.planPago; }
    public getEstado(): EstadoVenta { return this.estado; }
    public getPenalidad(): Penalidad | null { return this.penalidad; }
}