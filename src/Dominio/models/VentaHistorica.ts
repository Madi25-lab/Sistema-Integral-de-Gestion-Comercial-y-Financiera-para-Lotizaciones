export class VentaHistorica {

    constructor(
        private readonly idVenta: number,
        private readonly cliente: string,
        private readonly asesor: string,
        private readonly fecha: Date,
        private readonly metodoDePago: string,
        private readonly precioVenta: number,
        private readonly detalles: string
    ) {}

    public getIdVenta(): number { return this.idVenta; }
    public getCliente(): string { return this.cliente; }
    public getAsesor(): string { return this.asesor; }
    public getFecha(): Date { return this.fecha; }
    public getMetodoDePago(): string { return this.metodoDePago; }
    public getPrecioVenta(): number { return this.precioVenta; }
    public getDetalles(): string { return this.detalles; }
}