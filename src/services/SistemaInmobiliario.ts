import { Asesor } from "../models/Asesor";
import { Lote } from "../models/Lote";
import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";

export class SistemaInmobiliario {

    private asesores: Asesor[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];

    private contadorAsesores: number = 1;
    private contadorLotes: number = 1;
    private contadorVentas: number = 1;

    // =========================
    // REGISTRAR ASESOR
    // =========================
    public registrarAsesor(
    nombre: string,
    usuario: string,
    contraseña: string
): Asesor {

    const existe = this.asesores.some(a => a.getUsuario() === usuario);
    if (existe) {
        throw new Error("Ya existe un asesor con ese usuario.");
    }

    const asesor = new Asesor(
        this.contadorAsesores++,
        nombre,
        usuario,
        contraseña
    );

    this.asesores.push(asesor);
    return asesor;
}

    // =========================
    // REGISTRAR LOTE
    // =========================
    public registrarLote(
    nombreLote: string,
    precio: number
    ): Lote {

        const lote = new Lote(
            this.contadorLotes++, nombreLote, precio
        );

        this.lotes.push(lote);
        return lote;
}

    // =========================
    // RESERVAR LOTE
    // =========================
    public reservarLote(loteId: number): void {
        const lote = this.buscarLotePorId(loteId);

        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        if (!lote.estaDisponible()) {
            throw new Error("El lote no está disponible.");
        }

        lote.reservar();
    }


    // =========================
    // CREAR VENTA
    // =========================
    public crearVenta(
    asesorId: number,
    clienteId: number,
    loteId: number,
    tipo: TipoVenta,
    numeroCuotas?: number
): Venta {

    const asesor = this.asesores.find(a => a.getId() === asesorId);
    if (!asesor) {
        throw new Error("Asesor no encontrado.");
    }

    const cliente = asesor.buscarClientePorId(clienteId);
    if (!cliente) {
        throw new Error("Cliente no encontrado para este asesor.");
    }

    const lote = this.lotes.find(l => l.getIdLote() === loteId);
    if (!lote) {
        throw new Error("Lote no encontrado.");
    }

    if (!lote.estaReservado()) {
        throw new Error("El lote debe estar reservado antes de generar la venta.");
    }

    const venta = new Venta(
        this.contadorVentas++, asesor, cliente, lote, tipo, numeroCuotas
    );

    this.ventas.push(venta);
    asesor.agregarVenta(venta);

    return venta;
}

    // =========================
    // BUSCAR LOTE
    // =========================
    public buscarLotePorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }
}