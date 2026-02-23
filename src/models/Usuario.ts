export abstract class Usuario {

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

    public validarCredenciales(usuario: string, contraseña: string): boolean {
        return this.usuario === usuario && this.contraseña === contraseña;
    }
}