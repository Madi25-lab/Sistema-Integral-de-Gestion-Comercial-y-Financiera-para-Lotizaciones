import { Cliente } from "../models/Cliente";
import { Lote } from "../models/Lote";
import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";

export class SistemaInmobiliario {

    private clientes: Cliente[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];

    private contadorClientes: number = 1;
    private contadorLotes: number = 1;
    private contadorVentas: number = 1;

    // =========================
    // REGISTRAR CLIENTE
    // =========================
    public registrarCliente(
        nombre: string,
        dni: string,
        celular: string,
        direccion: string
    ): Cliente {

        const existe = this.clientes.some(c => c.getDni() === dni);

        if (existe) {
            throw new Error("Ya existe un cliente con ese DNI.");
        }

        const cliente = new Cliente(
            this.contadorClientes++, nombre, dni, celular, direccion
        );

        this.clientes.push(cliente);
        return cliente;
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
        clienteId: number,
        loteId: number,
        tipo: TipoVenta,
        numeroCuotas?: number
    ): Venta {

        const cliente = this.clientes.find(c => c.getId() === clienteId);
        const lote = this.lotes.find(l => l.getIdLote() === loteId);

        if (!cliente) {
            throw new Error("Cliente no encontrado.");
        }

        if (!lote) {
            throw new Error("Lote no encontrado.");
        }

        // Refuerzo adicional de seguridad
        if (!lote.estaReservado()) {
            throw new Error("El lote debe estar reservado antes de generar la venta.");
        }

        const venta = new Venta(
            this.contadorVentas++, cliente, lote, tipo, numeroCuotas
        );

        this.ventas.push(venta);
        return venta;
    }

    // =========================
    // BUSCAR LOTE
    // =========================
    public buscarLotePorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }
}