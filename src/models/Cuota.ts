export class Cuota {

    private pagada: boolean = false;

    constructor(
        private numero: number,
        private monto: number
    ) {
        if (numero <= 0) {
            throw new Error("El número de cuota debe ser mayor a cero.");
        }

        if (monto <= 0) {
            throw new Error("El monto debe ser mayor a cero.");
        }
    }

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

    public getNumero(): number {
        return this.numero;
    }
}