export class Penalidad {

    private montoCalculado: number;
    private fecha: Date;

    constructor(
        private porcentaje: number,
        private precioLote: number,
        private totalPagado: number
    ) {
        if (porcentaje < 0 || porcentaje > 1) {
            throw new Error("Porcentaje inválido.");
        }
        if (precioLote <= 0) {
            throw new Error("El precio del lote debe ser válido.");
        }

        this.fecha = new Date();
        this.montoCalculado = this.precioLote * this.porcentaje;
    }

    public getMonto(): number {
        return this.montoCalculado;
    }

    public getFecha(): Date {
        return this.fecha;
    }

    public getDevolucion(): number {
        return Math.max(this.totalPagado - this.montoCalculado, 0);
    }

    public getPorcentaje(): number {
        return this.porcentaje;
    }
}