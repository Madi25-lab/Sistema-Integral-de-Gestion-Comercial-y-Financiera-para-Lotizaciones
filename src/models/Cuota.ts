export class Cuota {

    private pagada: boolean = false;
    private montoInteres: number = 0;
    private fechaPago?: Date;

    constructor(
        private numero: number,
        private montoBase: number,
        private fechaVencimiento: Date
    ) {}

    public pagar(fechaPago: Date, tasaDiaria: number): void {

        if (this.pagada) {
            throw new Error("La cuota ya fue pagada.");
        }

        if (tasaDiaria < 0) {
            throw new Error("La tasa diaria no puede ser negativa.");
        }

        this.fechaPago = fechaPago;

        let diasMora = 0;

        if (fechaPago > this.fechaVencimiento) {
            const diff = fechaPago.getTime() - this.fechaVencimiento.getTime();
            diasMora = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        this.montoInteres = parseFloat(
            (this.montoBase * tasaDiaria * diasMora).toFixed(2)
        );

        this.pagada = true;
    }

    public getMontoTotal(): number {
        return parseFloat(
            (this.montoBase + this.montoInteres).toFixed(2)
        );
    }

    public getMontoBase(): number {
        return this.montoBase;
    }

    public getInteres(): number {
        return this.montoInteres;
    }

    public estaPagada(): boolean {
        return this.pagada;
    }

    public getNumero(): number {
        return this.numero;
    }

    public getFechaVencimiento(): Date {
        return this.fechaVencimiento;
    }

    public getFechaPago(): Date | undefined {
        return this.fechaPago;
    }
}