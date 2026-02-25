import { Identificable } from "../interfaces/Identificable";

export abstract class Usuario implements Identificable {

    private intentosFallidos: number = 0;
    private bloqueado: boolean = false;
    private readonly MAX_INTENTOS = 3;

    constructor(
        protected id: number,
        protected nombre: string,
        protected usuario: string,
        protected contraseña: string
    ) {}

    public getId(): number {
        return this.id;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public getUsuario(): string {
        return this.usuario;
    }

    public estaBloqueado(): boolean {
        return this.bloqueado;
    }

    public validarCredenciales(usuario: string, contraseña: string): boolean {

        if (this.bloqueado) {
            throw new Error("Usuario bloqueado.");
        }

        if (this.usuario === usuario && this.contraseña === contraseña) {
            this.intentosFallidos = 0;
            return true;
        }

        this.intentosFallidos++;

        if (this.intentosFallidos >= this.MAX_INTENTOS) {
            this.bloqueado = true;
        }

        return false;
    }

    public getIntentosRestantes(): number {
        return this.MAX_INTENTOS - this.intentosFallidos;
    }

    public abstract getTipo(): string;
}