import { Cliente } from "./Cliente";
import { Venta } from "./Venta";

export class Asesor {

    private clientes: Cliente[] = [];
    private ventas: Venta[] = [];

    constructor(
        private id: number,
        private nombre: string,
        private usuario: string,
        private contraseña: string
    ) {}

    public agregarCliente(cliente: Cliente): void {
        this.clientes.push(cliente);
    }

    public agregarVenta(venta: Venta): void {
        this.ventas.push(venta);
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