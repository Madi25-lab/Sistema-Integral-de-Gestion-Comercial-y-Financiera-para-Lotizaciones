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
        numeroCuotas?: number
    ) {

        this.estado = EstadoVenta.ACTIVA;

        if (!lote.estaReservado()) {
            throw new Error("El lote debe estar reservado antes de generar una venta.");
        }

        if (tipo === TipoVenta.CONTADO) {

            this.lote.vender();

        } else {

            if (!numeroCuotas || numeroCuotas <= 0) {
                throw new Error("Debe especificar un número válido de cuotas.");
            }

            this.lote.activarFinanciamiento();
            this.planPago = new PlanPago(lote.getPrecio(), numeroCuotas);
        }
    }

    // =========================
    // PAGOS
    // =========================

    public pagarCuota(numero: number): void {

        if (this.estado === EstadoVenta.ANULADA) {
            throw new Error("No se puede pagar una venta anulada.");
        }

        if (!this.planPago) {
            throw new Error("Esta venta no es financiada.");
        }

        this.planPago.pagarCuota(numero);

        if (this.planPago.estaCompletamentePagado()) {
            this.lote.vender();
        }
    }

    // =========================
    // ANULACIÓN
    // =========================

    public anularVenta(porcentajePenalidad: number): number {

        if (this.estado === EstadoVenta.ANULADA) {
            throw new Error("La venta ya fue anulada.");
        }

        if (this.tipo === TipoVenta.CONTADO) {
            throw new Error("No se puede anular una venta al contado.");
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

    // =========================
    // GETTERS
    // =========================

    public getIdVenta(): number {
        return this.idVenta;
    }

    public getAsesor(): Asesor {
        return this.asesor;
    }

    public getCliente(): Cliente {
        return this.cliente;
    }

    public getLote(): Lote {
        return this.lote;
    }

    public getTipo(): TipoVenta {
        return this.tipo;
    }

    public getPlanPago(): PlanPago | null {
        return this.planPago;
    }

    public getEstado(): EstadoVenta {
        return this.estado;
    }

    public getPenalidad(): Penalidad | null {
        return this.penalidad;
    }
}