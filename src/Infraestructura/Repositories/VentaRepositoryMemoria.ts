import { Venta } from "../../Dominio/models/Venta";

export class VentaRepositoryMemoria {

    private ventas: Venta[] = [];

    guardar(venta: Venta): void {
        this.ventas.push(venta);
    }

    obtenerTodos(): Venta[] {
        return this.ventas;
    }

    eliminar(id: number): void {
        const index = this.ventas.findIndex(v => v.getIdVenta() === id);
        if (index !== -1) {
            this.ventas.splice(index, 1);
        }
    }
}