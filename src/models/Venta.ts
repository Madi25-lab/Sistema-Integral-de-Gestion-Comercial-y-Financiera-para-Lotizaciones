import { Cliente } from "./Cliente";
import { Lote } from "./Lote";
import { TipoVenta } from "../enums/TipoVenta";

export class Venta {

    constructor(
        private id: number,
        private cliente: Cliente,
        private lote: Lote,
        private tipo: TipoVenta
    ) {

        // Siempre debe estar reservado antes
        if (lote.getEstado() !== "RESERVADO") {
            throw new Error("El lote debe estar reservado antes de generar una venta.");
        }

        if (tipo === TipoVenta.CONTADO) {
            this.lote.vender();
        } else {
            this.lote.activarFinanciamiento();
        }
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
}