import { Identificable } from "../interfaces/Identificable";
import { TipoUsuario } from "../enums/TipoUsuario";

export abstract class Usuario implements Identificable {

    constructor(
        protected id: number,
        protected nombre: string,
        protected usuario: string,
        protected contraseña: string
    ) {}

    public validarCredenciales(
        usuario: string,
        contraseña: string
    ): boolean {
        return this.usuario === usuario &&
               this.contraseña === contraseña;
    }

    public getUsuario(): string {
        return this.usuario;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public abstract getTipo(): TipoUsuario;
}