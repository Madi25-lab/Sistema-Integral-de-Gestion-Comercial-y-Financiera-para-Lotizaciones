import { Usuario } from "./Usuario";
import { Cliente } from "./Cliente";
import { Venta } from "./Venta";

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
        super(id, nombre, usuario, contraseña);
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

        const existe = this.clientes.some(c => c.getDni() === dni);
        if (existe) {
            throw new Error("Ya existe un cliente con ese DNI.");
        }

        const cliente = new Cliente(
            this.contadorClientes++,
            nombre,
            dni,
            direccion,
            telefono
        );

        this.clientes.push(cliente);
        return cliente;
    }

    public buscarClientePorId(id: number) {
    return this.clientes.find(c => c.getId() === id);
}

    public getTipo(): string {
    return "ASESOR";
}

    public agregarVenta(venta: Venta): void {
        this.ventas.push(venta);
    }

    public getClientes(): Cliente[] {
        return this.clientes;
    }

    public getVentas(): Venta[] {
        return this.ventas;
    }
}