export class Cuota {
    private pagada: boolean = false;

    constructor(
        private numero: number,
        private monto: number
    ) {}

    public pagar(): void {
        if (this.pagada) {
            throw new Error("La cuota ya está pagada.");
        }
        this.pagada = true;
    }

    public estaPagada(): boolean {
        return this.pagada;
    }

    public getMonto(): number {
        return this.monto;
    }
}