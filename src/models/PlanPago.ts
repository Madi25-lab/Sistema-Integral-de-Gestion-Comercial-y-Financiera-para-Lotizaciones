import { Cuota } from "./Cuota";

export class PlanPago {

    private cuotas: Cuota[] = [];
    private tasaInteresDiaria: number;

    constructor(
        private montoTotal: number,
        private numeroCuotas: number,
        tasaInteresDiaria: number
    ) {

        if (montoTotal <= 0) {
            throw new Error("El monto total debe ser mayor a cero.");
        }

        if (numeroCuotas <= 0) {
            throw new Error("El número de cuotas debe ser mayor a cero.");
        }

        if (tasaInteresDiaria < 0) {
            throw new Error("La tasa de interés no puede ser negativa.");
        }

        this.tasaInteresDiaria = tasaInteresDiaria;

        const montoPorCuota = parseFloat(
            (montoTotal / numeroCuotas).toFixed(2)
        );

        const fechaBase = new Date();

        for (let i = 1; i <= numeroCuotas; i++) {

            const fechaVencimiento = new Date(fechaBase);
            fechaVencimiento.setMonth(fechaBase.getMonth() + i);

            this.cuotas.push(
                new Cuota(i, montoPorCuota, fechaVencimiento)
            );
        }
    }

    public pagarCuota(numero: number, fechaPago: Date): void {

        const cuota = this.cuotas.find(c => c.getNumero() === numero);

        if (!cuota) {
            throw new Error("Cuota no encontrada.");
        }

        cuota.pagar(fechaPago, this.tasaInteresDiaria);
    }

    public modificarTasaInteres(nuevaTasa: number): void {
        if (nuevaTasa < 0) {
            throw new Error("La tasa no puede ser negativa.");
        }
        this.tasaInteresDiaria = nuevaTasa;
    }

    public obtenerSaldoPendiente(): number {
        return this.cuotas
            .filter(c => !c.estaPagada())
            .reduce((total, c) => total + c.getMontoBase(), 0);
    }

    public obtenerTotalPagado(): number {
        return this.cuotas
            .filter(c => c.estaPagada())
            .reduce((total, c) => total + c.getMontoTotal(), 0);
    }

    public estaCompletamentePagado(): boolean {
        return this.cuotas.every(c => c.estaPagada());
    }

    public getCuotas(): Cuota[] {
        return this.cuotas;
    }
}