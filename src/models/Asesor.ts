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

    // =========================
    // GETTERS
    // =========================

    public getId(): number {
        return this.id;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public getUsuario(): string {
        return this.usuario;
    }

    // ❌ NO exponemos getContraseña por seguridad

    // =========================
    // LOGIN
    // =========================

    public validarCredenciales(usuario: string, contraseña: string): boolean {
        return this.usuario === usuario && this.contraseña === contraseña;
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
            throw new Error("Ya existe un cliente con ese DNI para este asesor.");
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
        this.ventas.push(venta);
    }

    public getVentas(): Venta[] {
        return this.ventas;
    }
}