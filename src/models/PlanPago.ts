import { Cuota } from "./Cuota";

export class PlanPago {

    private cuotas: Cuota[] = [];

    constructor(
        private montoTotal: number,
        private numeroCuotas: number
    ) {

        if (montoTotal <= 0) {
            throw new Error("El monto total debe ser mayor a cero.");
        }

        if (numeroCuotas <= 0) {
            throw new Error("El número de cuotas debe ser mayor a cero.");
        }

        const montoPorCuota = parseFloat((montoTotal / numeroCuotas).toFixed(2));

        for (let i = 1; i <= numeroCuotas; i++) {
            this.cuotas.push(new Cuota(i, montoPorCuota));
        }
    }

    public obtenerSaldoPendiente(): number {
        return this.cuotas
            .filter(c => !c.estaPagada())
            .reduce((total, c) => total + c.getMonto(), 0);
    }

    public obtenerTotalPagado(): number {
        return this.cuotas
            .filter(c => c.estaPagada())
            .reduce((total, c) => total + c.getMonto(), 0);
    }

    public pagarCuota(numero: number): void {

        const cuota = this.cuotas.find(c => c.getNumero() === numero);

        if (!cuota) {
            throw new Error("Cuota no encontrada.");
        }

        cuota.pagar();
    }

    public estaCompletamentePagado(): boolean {
        return this.cuotas.every(c => c.estaPagada());
    }

    public getCuotas(): Cuota[] {
        return this.cuotas;
    }
}