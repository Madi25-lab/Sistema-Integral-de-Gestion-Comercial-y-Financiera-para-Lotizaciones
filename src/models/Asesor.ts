import { Usuario } from "./Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";
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

    const existe = this.clientes.some(c =>
        c.getDni() === dni ||
        c.getTelefono() === telefono ||
        c.getNombre().toLowerCase().trim() === nombre.toLowerCase().trim()
    );

    if (existe) {
        throw new Error("Ya existe un cliente con el mismo DNI, teléfono o nombre.");
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

    public buscarClientePorId(id: number){
    return this.clientes.find(c => c.getId() === id);
}

    public getTipo(): TipoUsuario {
    return TipoUsuario.ASESOR;
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