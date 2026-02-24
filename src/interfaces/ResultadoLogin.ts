import { Usuario } from "../models/Usuario";

export interface ResultadoLogin {
    exito: boolean;
    mensaje: string;
    usuario?: Usuario;
}