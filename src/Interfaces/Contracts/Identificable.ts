import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";

export interface Identificable {
    getTipo(): TipoUsuario;
}