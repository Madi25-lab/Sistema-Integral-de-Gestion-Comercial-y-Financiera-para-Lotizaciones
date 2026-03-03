import { Usuario } from "../../Dominio/models/Usuario";
import { Asesor } from "../../Dominio/models/Asesor";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { UsuarioRepositoryArchivo } from "../../Infraestructura/Repositories/UsuarioRepositoryArchivo";

export class UsuarioService{
    constructor(
    private usuarios: Usuario[],
    private usuarioRepo: UsuarioRepositoryArchivo
    ){}

    public agregarAsesor(
        usuarioLogueado:Usuario,
        nombre: string,
        usuario: string,
        contraseña: string
    ): Asesor {

        if (usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede agregar asesores. ");
        }

        // Validar datos básicos
        if (!nombre || nombre.trim() === "") {
            throw new Error("El nombre es obligatorio.");
        }

        if (!usuario || usuario.trim() === "") {
            throw new Error("El usuario es obligatorio.");
        }

        if (!contraseña || contraseña.trim() === "") {
            throw new Error("La contraseña es obligatoria.");
        }

        // ❗ Evitar usuario duplicado
        const existeUsuario = this.usuarios.some(
            u => u.getUsuario() === usuario
        );

        if (existeUsuario) {
            throw new Error("Ya existe un usuario con ese nombre.");
        }

        // Generar nuevo ID automático
        const nuevoId = this.usuarios.length > 0
            ? Math.max(...this.usuarios.map(u => u.getId())) + 1
            : 1;

        const asesor = new Asesor(
            nuevoId,
            nombre,
            usuario,
            contraseña
        );

        this.usuarios.push(asesor);
        this.usuarioRepo.guardar(asesor);

        return asesor;
    }
}