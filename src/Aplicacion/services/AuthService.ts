import { Usuario } from "../../Dominio/models/Usuario";
import { ResultadoLogin } from "../dto/ResultadoLogin";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { Asesor } from "../../Dominio/models/Asesor";

export class AuthService{

    private usuarioLogueado: Usuario | null = null;

    constructor(private usuarios: Usuario[]){}

    public login(usuario: string, contraseña: string): ResultadoLogin {

    const encontrado = this.usuarios.find(u =>
        u.getUsuario() === usuario
    );

    if (!encontrado) {
        return { exito: false, mensaje: "Usuario no encontrado." };
    }

    if (encontrado.estaBloqueado()) {
        return {
            exito: false,
            mensaje: "Usuario bloqueado. Contacte al jefe."
        };
    }

    const valido = encontrado.validarCredenciales(usuario, contraseña);

    if (!valido) {

        if (encontrado.estaBloqueado()) {
            return {
                exito: false,
                mensaje: "Usuario bloqueado por demasiados intentos."
            };
        }

        return {
            exito: false,
            mensaje: `Credenciales incorrectas. Intentos restantes: ${encontrado.getIntentosRestantes()}`
        };
    }

    this.usuarioLogueado = encontrado;

    return {
        exito: true,
        mensaje: "Login exitoso.",
        usuario: encontrado
        };
    }

    public logout(): void {
        this.usuarioLogueado = null;
    }

    public getUsuarioLogueado(): Usuario | null {
        return this.usuarioLogueado;
    }

    private verificarSesion(): void {
            if (!this.usuarioLogueado) {
                throw new Error("Debe iniciar sesión.");
        }
    }
    
    private verificarJefe(): void {
        this.verificarSesion();
    
        if (!this.usuarioLogueado) {
            throw new Error("No hay sesión activa.");
        }
    
        if (this.usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Acceso solo para jefe.");
            }
        }
        
        private verificarAsesor(): Asesor {
            this.verificarSesion();
    
            if (this.usuarioLogueado!.getTipo() !== TipoUsuario.ASESOR) {
                throw new Error("Acceso solo para asesor.");
            }
    
            return this.usuarioLogueado as Asesor;
        }
}