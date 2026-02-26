import { Usuario } from "./Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";
import { PlanPago } from "./PlanPago";

export class Jefe extends Usuario {

    constructor(
        id: number,
        nombre: string,
        usuario: string,
        contraseña: string
    ) {
        super(id, nombre, usuario, contraseña);
    }

    public getTipo(): TipoUsuario {
    return TipoUsuario.JEFE;
}

    public cambiarTasaInteres(plan: PlanPago, nuevaTasa: number): void {
        plan.modificarTasaInteres(nuevaTasa);
        }
}

    