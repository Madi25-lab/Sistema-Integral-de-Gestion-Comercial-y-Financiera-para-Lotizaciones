import { Usuario } from "../../Dominio/models/Usuario";

export interface ResultadoLogin {
    exito: boolean;
    mensaje: string;
    usuario?: Usuario;
}