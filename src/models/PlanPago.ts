import { Cuota } from "./Cuota";

export class PlanPago {

    private cuotas: Cuota[] = [];

    constructor(
        private montoTotal: number,
        private numeroCuotas: number,
        private tasaInteresDiaria: number
    ) {

        const montoPorCuota = parseFloat(
            (montoTotal / numeroCuotas).toFixed(2)
        );

        const fechaBase = new Date();

        for (let i = 1; i <= numeroCuotas; i++) {

            const fecha = new Date(fechaBase);
            fecha.setMonth(fechaBase.getMonth() + i);

            this.cuotas.push(
                new Cuota(i, montoPorCuota, fecha)
            );
        }
    }

    public pagarCuota(numero: number, fechaPago: Date): void {

        const cuota = this.cuotas.find(c => c.getNumero() === numero);
        if (!cuota) throw new Error("Cuota no encontrada.");

        cuota.pagar(fechaPago, this.tasaInteresDiaria);
    }

    public modificarTasaInteres(nuevaTasa: number): void {
        if (nuevaTasa < 0 || nuevaTasa > 1) {
            throw new Error("Tasa inválida.");
        }
        this.tasaInteresDiaria = nuevaTasa;
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