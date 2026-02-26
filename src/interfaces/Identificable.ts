import { TipoUsuario } from "../enums/TipoUsuario";

export interface Identificable {
    getTipo(): TipoUsuario;
}