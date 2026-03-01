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
        super(id, nombre, usuario, contraseña, TipoUsuario.JEFE);
    }

    public getTipo(): TipoUsuario {
        return this.tipo;
    }

    // =========================
    // MODIFICAR TASA DE INTERÉS
    // =========================

    public cambiarTasaInteres(plan: PlanPago | null, nuevaTasa: number): void {

        if (!plan) {
            throw new Error("El plan de pago no existe.");
        }

        if (nuevaTasa < 0) {
            throw new Error("La tasa de interés no puede ser negativa.");
        }

        plan.modificarTasaInteres(nuevaTasa);
    }
}