import { Cliente } from "../models/Cliente";
import { Lote } from "../models/Lote";
import { Venta } from "../models/Venta";
import { TipoVenta } from "../enums/TipoVenta";

export class SistemaInmobiliario {

    private clientes: Cliente[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];
    private contadorClientes: number = 1;
    private contadorVentas: number = 1;

    // Registrar cliente
    public registrarCliente(
    nombre: string,
    dni: string,
    celular: string,
    direccion: string
): Cliente {

    const cliente = new Cliente(
        this.contadorClientes++,
        nombre,
        dni,
        celular,
        direccion
    );

    this.clientes.push(cliente);
    return cliente;
}

    // Registrar lote
    public registrarLote(lote: Lote): void {
        this.lotes.push(lote);
    }

    // Buscar lote por ID
    public buscarLotePorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }

    // Crear venta
    public crearVenta(
    clienteId: number,
    loteId: number,
    tipo: TipoVenta,
    numeroCuotas?: number
    ): Venta {

    const cliente = this.clientes.find(c => c.getId() === clienteId);
    const lote = this.lotes.find(l => l.getIdLote() === loteId);

    if (!cliente) throw new Error("Cliente no encontrado.");
    if (!lote) throw new Error("Lote no encontrado.");

    const venta = new Venta(
        this.contadorVentas++,
        cliente,
        lote,
        tipo,
        numeroCuotas
    );

    this.ventas.push(venta);
    return venta;
    }
}