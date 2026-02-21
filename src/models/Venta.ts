import { Asesor } from "./Asesor";
import { Cliente } from "./Cliente";
import { Lote } from "./Lote";
import { TipoVenta } from "../enums/TipoVenta";
import { PlanPago } from "./PlanPago";
import { EstadoLote } from "../enums/EstadoLote";

export class Venta {

    private planPago?: PlanPago;

    constructor(
    private idVenta: number,
    private asesor: Asesor,
    private cliente: Cliente,
    private lote: Lote,
    private tipo: TipoVenta,
    numeroCuotas?: number
) {

        // Siempre debe estar reservado antes
        if (lote.getEstado() !== EstadoLote.RESERVADO) {
            throw new Error("El lote debe estar reservado antes de generar una venta.");
        }

        if (tipo === TipoVenta.CONTADO) {
            this.lote.vender();
        } else {
            if (numeroCuotas === undefined || numeroCuotas <= 0) {
                throw new Error("Debe especificar el número de cuotas.");
            }

            this.lote.activarFinanciamiento();
            this.planPago = new PlanPago(lote.getPrecio(), numeroCuotas);
        }
    }

    public pagarCuota(numero: number): void {
    if (!this.planPago) {
        throw new Error("Esta venta no es financiada.");
    }

    this.planPago.pagarCuota(numero);

    // Verificamos si ya terminó de pagar todo
    if (this.planPago.estaCompletamentePagado()) {
        this.lote.vender();
    }
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

    public getPlanPago(): PlanPago | undefined {
        return this.planPago;
    }

    public verificarEstadoFinal(): void {
        if (this.planPago && this.planPago.estaCompletamentePagado()) {
            this.lote.vender();
        }
    }
}