import { Usuario } from "./Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";
import { Cliente } from "./Cliente";
import { Venta } from "./Venta";
import { EstadoVenta } from "../enums/EstadoVenta";

export class Asesor extends Usuario {

    private clientes: Cliente[] = [];
    private ventas: Venta[] = [];
    private contadorClientes: number = 1;

    constructor(
        id: number,
        nombre: string,
        usuario: string,
        contraseña: string
    ) {
        super(id, nombre, usuario, contraseña, TipoUsuario.ASESOR);
    }

    public getTipo(): TipoUsuario {
        return this.tipo;
    }

    // =========================
    // CLIENTES
    // =========================

    public registrarCliente(
        nombre: string,
        dni: string,
        direccion: string,
        telefono: string
    ): Cliente {

        const existe = this.clientes.some(c =>
            c.getDni() === dni ||
            c.getTelefono() === telefono
        );

        if (existe) {
            throw new Error("Ya existe un cliente con el mismo DNI o teléfono.");
        }

        const cliente = new Cliente(
            this.contadorClientes++,
            nombre,
            dni,
            telefono,
            direccion
        );

        this.clientes.push(cliente);
        return cliente;
    }

    public buscarClientePorId(id: number): Cliente | undefined {
        return this.clientes.find(c => c.getId() === id);
    }

    public getClientes(): Cliente[] {
        return this.clientes;
    }

    // =========================
    // VENTAS
    // =========================

    public agregarVenta(venta: Venta): void {

        if (venta.getEstado() === EstadoVenta.ANULADA) {
            throw new Error("No se puede registrar una venta anulada.");
        }

        this.ventas.push(venta);
    }

    public getVentas(): Venta[] {
        return this.ventas;
    }
}