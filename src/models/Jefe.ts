import { Usuario } from "./Usuario";

export class Jefe extends Usuario {

    constructor(
        id: number,
        nombre: string,
        usuario: string,
        contraseña: string
    ) {
        super(id, nombre, usuario, contraseña);
    }

    // Aquí luego agregaremos métodos exclusivos del jefe
}