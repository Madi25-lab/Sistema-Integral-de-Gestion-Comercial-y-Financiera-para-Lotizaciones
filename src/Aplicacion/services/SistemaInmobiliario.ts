// ==== C:\Users\HP\Desktop\Proyecto_Final\src\Aplicacion\services\SistemaInmobiliario.ts ====

import { AuthService } from "./AuthService";
import { UsuarioService } from "./UsuarioService";
import { LoteService } from "./LoteService";
import { VentaService } from "./VentaService";
import { ReporteService } from "./ReporteService";

import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { TipoVenta } from "../../Dominio/enums/TipoVenta";

import { UsuarioRepositoryArchivo } from "../../Infraestructura/Repositories/UsuarioRepositoryArchivo"; 
import { LoteRepositoryArchivo } from "../../Infraestructura/Repositories/LoteRepositoryArchivo";
import { VentaRepositoryArchivo } from "../../Infraestructura/Repositories/VentaRepositoryArchivo";

import { Asesor } from "../../Dominio/models/Asesor";
import { Venta } from "../../Dominio/models/Venta";

export class SistemaInmobiliario {

    public auth: AuthService;
    public usuarioService: UsuarioService;
    public loteService: LoteService;
    public ventaService: VentaService;
    public reporteService: ReporteService;

    private porcentajePenalidad: number = 0.10;
    private tasaInteresDiariaGlobal: number = 0.001;

    private usuarioRepo: UsuarioRepositoryArchivo;
    private loteRepo: LoteRepositoryArchivo;
    private ventaRepo: VentaRepositoryArchivo;

    constructor(
        usuarioRepo: UsuarioRepositoryArchivo,
        loteRepo: LoteRepositoryArchivo,
        ventaRepo: VentaRepositoryArchivo
    ) {

        this.usuarioRepo = usuarioRepo;
        this.loteRepo = loteRepo;
        this.ventaRepo = ventaRepo;

        const usuarios = this.usuarioRepo.obtenerTodos();
        const lotes = this.loteRepo.obtenerTodos();
        const ventas = this.ventaRepo.obtenerTodos();

        this.auth = new AuthService(usuarios);
        this.usuarioService = new UsuarioService(usuarios, this.usuarioRepo);
        this.loteService = new LoteService(lotes);

        const clientes: any[] = [];

        this.ventaService = new VentaService(
            ventas,
            lotes,
            clientes,
            this.tasaInteresDiariaGlobal,
            this.porcentajePenalidad
        );

        this.reporteService = new ReporteService(
            ventas,
            usuarios.filter(u => u.getTipo() === TipoUsuario.ASESOR)
        );
    }

    // ================= CREAR VENTA CORREGIDO =================

    public crearVenta(
    usuario: Asesor,
    clienteId: number,
    loteId: number,
    tipo: TipoVenta,
    numeroCuotas?: number
    ): Venta {

    const usuarioLogueado = this.auth.getUsuarioLogueado();

    if (!usuarioLogueado || usuarioLogueado.getTipo() !== TipoUsuario.ASESOR) {
        throw new Error("Solo un asesor puede crear ventas.");
    }

    const lote = this.loteRepo.buscarPorId(loteId);

    if (!lote) {
        throw new Error("Lote no encontrado.");
    }

    if (!lote.estaDisponible()) {
        throw new Error("El lote no está disponible.");
    }

    const venta = this.ventaService.crearVenta(
        usuario,
        clienteId,
        loteId,
        tipo,
        numeroCuotas
    );

    this.ventaRepo.guardar(venta);

    return venta;
    }

    // ================= ANULAR =================

    public anularVenta(idVenta: number): void {

    this.ventaService.anularVenta(idVenta);
    this.ventaRepo.eliminar(idVenta);
    }

    // ================= DESBLOQUEAR =================

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
            throw new Error("La tasa debe estar entre 0 y 1.");
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