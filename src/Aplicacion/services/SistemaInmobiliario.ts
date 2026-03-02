import { Usuario } from "../../Dominio/models/Usuario";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { Jefe } from "../../Dominio/models/Jefe";
import { Asesor } from "../../Dominio/models/Asesor";
import { Cliente } from "../../Dominio/models/Cliente";
import { Lote } from "../../Dominio/models/Lote";
import { Venta } from "../../Dominio/models/Venta";
import { AuthService } from "./AuthService";
import { UsuarioService } from "./UsuarioService";
import { LoteService } from "./LoteService";
import { VentaService } from "./VentaService";
import { ReporteService } from "./ReporteService";

export class SistemaInmobiliario {

    private usuarios: Usuario[] = [];
    private lotes: Lote[] = [];
    private ventas: Venta[] = [];
    private clientes:Cliente[]=[];

    private porcentajePenalidad: number = 0.10;
    private tasaInteresDiariaGlobal: number = 0.001;

    public auth: AuthService;
    public usuarioService: UsuarioService;
    public loteService: LoteService;
    public ventaService: VentaService;
    public reporteService: ReporteService;

    constructor() {

        // Crear jefe inicial
        const jefe = new Jefe(1, "Administrador", "admin", "1234");
        this.usuarios.push(jefe);

        // Inicializar services
        this.auth = new AuthService(this.usuarios);

        this.usuarioService = new UsuarioService(this.usuarios);

        this.loteService = new LoteService(this.lotes);

        this.ventaService = new VentaService(
            this.ventas,
            this.lotes,
            this.clientes,
            this.tasaInteresDiariaGlobal,
            this.porcentajePenalidad
        );

        this.reporteService = new ReporteService(
            this.ventas,
            this.usuarios.filter(u => u instanceof Asesor) as Asesor[]
        );
    }

    // ================= MÉTODO DE DESBLOQUEO =================

    public desbloquearUsuario(idUsuario: number): void {

        const usuarioLogueado = this.auth.getUsuarioLogueado();

        if (!usuarioLogueado || usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede desbloquear usuarios.");
        }

        const usuario = this.usuarios.find(u => u.getId() === idUsuario);

        if (!usuario) {
            throw new Error("Usuario no encontrado.");
        }

        if (!usuario.estaBloqueado()) {
            throw new Error("El usuario no está bloqueado.");
        }

        usuario.desbloquear();
    }

    // ================= CONFIGURACIÓN =================

    public actualizarTasaInteresGlobal(nuevaTasa: number): void {

        const usuarioLogueado = this.auth.getUsuarioLogueado();

        if (!usuarioLogueado || usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede modificar la tasa.");
        }

        if (nuevaTasa < 0 || nuevaTasa > 1) {
            throw new Error("Tasa inválida.");
        }

        this.tasaInteresDiariaGlobal = nuevaTasa;
    }

    public actualizarPorcentajePenalidad(nuevo: number): void {

        const usuarioLogueado = this.auth.getUsuarioLogueado();

        if (!usuarioLogueado || usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede modificar la penalidad.");
        }

        if (nuevo < 0 || nuevo > 1) {
            throw new Error("Porcentaje inválido.");
        }

        this.porcentajePenalidad = nuevo;
    }
}