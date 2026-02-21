import { Cliente } from "./Cliente";
import { Venta } from "./Venta";

export class Asesor {

    private clientes: Cliente[] = [];
    private ventas: Venta[] = [];
    private contadorClientes: number = 1;

    constructor(
        private id: number,
        private nombre: string,
        private usuario: string,
        private contraseña: string
    ) {}

    // Registrar cliente propio
    public registrarCliente(
        nombre: string,
        dni: string,
        celular: string,
        direccion: string
    ): Cliente {

        const existe = this.clientes.some(c => c.getDni() === dni);
        if (existe) {
            throw new Error("Ya existe un cliente con ese DNI para este asesor.");
        }

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

    public agregarVenta(venta: Venta): void {
        this.ventas.push(venta);
    }

    public buscarClientePorId(id: number): Cliente | undefined {
        return this.clientes.find(c => c.getId() === id);
    }

    public getId(): number {
        return this.id;
    }

    public getUsuario(): string {
        return this.usuario;
    }

    public getContraseña(): string {
        return this.contraseña;
    }
}