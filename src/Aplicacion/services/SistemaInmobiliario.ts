import { AuthService } from "./AuthService";
import { UsuarioService } from "./UsuarioService";
import { LoteService } from "./LoteService";
import { VentaService } from "./VentaService";
import { ReporteService } from "./ReporteService";

import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";

import { UsuarioRepositoryMemoria } from "../../Infraestructura/Repositories/UsuarioRepositoryMemoria";
import { LoteRepositoryMemoria } from "../../Infraestructura/Repositories/LoteRepositoryMemoria";
import { VentaRepositoryMemoria } from "../../Infraestructura/Repositories/VentaRepositoryMemoria";

export class SistemaInmobiliario {

    public auth: AuthService;
    public usuarioService: UsuarioService;
    public loteService: LoteService;
    public ventaService: VentaService;
    public reporteService: ReporteService;

    private porcentajePenalidad: number = 0.10;
    private tasaInteresDiariaGlobal: number = 0.001;

    // ahora guardamos los repositorios
    private usuarioRepo: UsuarioRepositoryMemoria;
    private loteRepo: LoteRepositoryMemoria;
    private ventaRepo: VentaRepositoryMemoria;

    constructor(
        usuarioRepo: UsuarioRepositoryMemoria,
        loteRepo: LoteRepositoryMemoria,
        ventaRepo: VentaRepositoryMemoria
    ) {

        this.usuarioRepo = usuarioRepo;
        this.loteRepo = loteRepo;
        this.ventaRepo = ventaRepo;

        this.auth = new AuthService(usuarioRepo.obtenerTodos());

        this.usuarioService = new UsuarioService(usuarioRepo.obtenerTodos());

        this.loteService = new LoteService(loteRepo.obtenerTodos());

        this.ventaService = new VentaService(
            ventaRepo.obtenerTodos(),
            loteRepo.obtenerTodos(),
            [],
            this.tasaInteresDiariaGlobal,
            this.porcentajePenalidad
        );

        this.reporteService = new ReporteService(
            ventaRepo.obtenerTodos(),
            usuarioRepo.obtenerTodos().filter(u => u.getTipo() === TipoUsuario.ASESOR)
        );
    }

    // ================= MÉTODO DE DESBLOQUEO =================

    public desbloquearUsuario(idUsuario: number): void {

        const usuarioLogueado = this.auth.getUsuarioLogueado();

        if (!usuarioLogueado || usuarioLogueado.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede desbloquear usuarios.");
        }

        const usuario = this.usuarioRepo
            .obtenerTodos()
            .find(u => u.getId() === idUsuario);

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