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
    private fecha: Date;

    constructor(
    private idVenta: number,
    private asesor: Asesor,
    private cliente: Cliente,
    private lote: Lote,
    private tipo: TipoVenta,
    private tasaInteresDiaria: number,
    numeroCuotas?: number,
    fecha?: Date,
    estado?: EstadoVenta
) {

    if (!lote.estaReservado() && !lote.estaEnFinanciamiento() && !lote.estaVendido()) {
        throw new Error("Estado inválido del lote para crear venta.");
    }

    this.fecha = fecha ?? new Date();
    this.estado = estado ?? EstadoVenta.ACTIVA;

    if (tipo === TipoVenta.CONTADO) {

        if (this.estado === EstadoVenta.COMPLETADA) {
            this.lote.marcarVendido();
        }

    } else {

        if (!numeroCuotas || numeroCuotas <= 0) {
            throw new Error("Número de cuotas inválido.");
        }

        this.planPago = new PlanPago(
            lote.getPrecio(),
            numeroCuotas,
            this.tasaInteresDiaria
        );
    }
}

    // =========================
    // PAGOS
    // =========================

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

    public estaCompletamentePagada(): boolean {

        if (this.tipo === TipoVenta.CONTADO) {
            return true;
        }

        if (!this.planPago) {
            return false;
        }

        return this.planPago.estaCompletamentePagado();
    }

    // =========================
    // ANULACIÓN
    // =========================

    public anularVenta(porcentajePenalidad: number): void {

    if (this.estado === EstadoVenta.ANULADA) {
        throw new Error("La venta ya está anulada.");
    }

    if (this.estado === EstadoVenta.COMPLETADA) {
        throw new Error("No se puede anular una venta completada.");
    }

    let totalPagado = 0;

    if (this.tipo === TipoVenta.CONTADO) {
        totalPagado = this.lote.getPrecio();
    } else {
        if (this.planPago) {
            totalPagado = this.planPago.obtenerTotalPagado();
        }
    }

    this.penalidad = new Penalidad(
        porcentajePenalidad,
        this.lote.getPrecio(),
        totalPagado
    );

    this.estado = EstadoVenta.ANULADA;

    this.lote.liberar(); 
}

    // =========================
    // GETTERS
    // =========================

    public getIdVenta(): number { return this.idVenta; }
    public getAsesor(): Asesor { return this.asesor; }
    public getCliente(): Cliente { return this.cliente; }
    public getLote(): Lote { return this.lote; }
    public getTipo(): TipoVenta { return this.tipo; }
    public getTotal(): number { return this.lote.getPrecio(); }
    public getPlanPago(): PlanPago | null { return this.planPago; }
    public getEstado(): EstadoVenta { return this.estado; }
    public getPenalidad(): Penalidad | null { return this.penalidad; }
    public getFecha(): Date { return this.fecha; } 
}