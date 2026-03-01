import { Identificable } from "../interfaces/Identificable";
import { TipoUsuario } from "../enums/TipoUsuario";

export abstract class Usuario implements Identificable {

    private intentosFallidos: number = 0;
    private bloqueado: boolean = false;
    private readonly MAX_INTENTOS: number = 3;

    constructor(
        protected id: number,
        protected nombre: string,
        protected usuario: string,
        protected contraseña: string,
        protected tipo: TipoUsuario   // ✅ ahora el tipo se guarda aquí
    ) {}

    // ================= LOGIN =================

    public validarCredenciales(
        usuario: string,
        contraseña: string
    ): boolean {

        if (this.bloqueado) {
            return false;
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

    // ================= BLOQUEO =================

    public estaBloqueado(): boolean {
        return this.bloqueado;
    }

    public desbloquear(): void {
        this.bloqueado = false;
        this.intentosFallidos = 0;
    }

    public getIntentosRestantes(): number {
        return this.MAX_INTENTOS - this.intentosFallidos;
    }

    // ================= GETTERS =================

    public getUsuario(): string {
        return this.usuario;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public getId(): number {
        return this.id;
    }

    public abstract getTipo(): TipoUsuario;
}