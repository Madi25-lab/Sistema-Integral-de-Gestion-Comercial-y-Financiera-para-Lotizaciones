import { Identificable } from "../interfaces/Identificable";

export abstract class Usuario implements Identificable {

    constructor(
        protected id: number,
        protected nombre: string,
        protected usuario: string,
        protected contraseña: string
    ) {}

    public getUsuario(): string {
        return this.usuario;
    }

    public validarCredenciales(usuario: string, contraseña: string): boolean {
        return this.usuario === usuario && this.contraseña === contraseña;
    }

    // Método abstracto obligatorio
    public abstract getTipo(): string;
}