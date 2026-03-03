import fs from "fs";
import path from "path";
import { Usuario } from "../../Dominio/models/Usuario";
import { Jefe } from "../../Dominio/models/Jefe";
import { Asesor } from "../../Dominio/models/Asesor";

export class UsuarioRepositoryArchivo {

    private ruta: string;

    constructor() {
        this.ruta = path.resolve("src/Infraestructura/Data/usuarios.json");
    }

    // =========================
    // UTILIDADES
    // =========================

    private leerArchivo(): any[] {
        if (!fs.existsSync(this.ruta)) {
            fs.writeFileSync(this.ruta, "[]");
        }

        const data = fs.readFileSync(this.ruta, "utf-8");
        return JSON.parse(data);
    }

    private escribirArchivo(data: any[]): void {
        fs.writeFileSync(this.ruta, JSON.stringify(data, null, 2));
    }

    private mapearUsuario(obj: any): Usuario {

        if (obj.tipo === "JEFE") {
            return new Jefe(obj.id, obj.nombre, obj.usuario, obj.contraseña);
        }

        return new Asesor(obj.id, obj.nombre, obj.usuario, obj.contraseña);
    }
    // =========================
    // MÉTODOS PÚBLICOS
    // =========================

    public obtenerTodos(): Usuario[] {
        return this.leerArchivo().map(obj => this.mapearUsuario(obj));
    }

    public guardar(usuario: Usuario): void {
        const data = this.leerArchivo();

        data.push({
            id: usuario.getId(),
            nombre: usuario.getNombre(),
            usuario: usuario.getUsuario(),
            contraseña: (usuario as any).contraseña,
            tipo: usuario.getTipo()
        });

        this.escribirArchivo(data);
    }

    public eliminar(id: number): void {
        const data = this.leerArchivo().filter(u => u.id !== id);
        this.escribirArchivo(data);
    }
}