import { Usuario } from "../../Dominio/models/Usuario";

export class UsuarioRepositoryMemoria {

    private usuarios: Usuario[] = [];

    guardar(usuario: Usuario): void {
        this.usuarios.push(usuario);
    }

    obtenerTodos(): Usuario[] {
        return this.usuarios;
    }

    buscarPorId(id: number): Usuario | undefined {
        return this.usuarios.find(u => u.getId() === id);
    }

    buscarPorUsername(username: string): Usuario | undefined {
        return this.usuarios.find(u => u.getUsuario() === username);
    }
}