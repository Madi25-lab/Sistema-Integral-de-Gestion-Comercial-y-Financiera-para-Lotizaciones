export class Jefe {

    constructor(
        private id: number,
        private nombre: string,
        private usuario: string,
        private contraseña: string
    ) {}

    public getUsuario(): string {
        return this.usuario;
    }

    public validarCredenciales(usuario: string, contraseña: string): boolean {
        return this.usuario === usuario && this.contraseña === contraseña;
    }
}