import fs from "fs";
import path from "path";

import { Venta } from "../../Dominio/models/Venta";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { Cliente } from "../../Dominio/models/Cliente";
import { Asesor } from "../../Dominio/models/Asesor";
import { TipoVenta } from "../../Dominio/enums/TipoVenta";

import { UsuarioRepositoryArchivo } from "./UsuarioRepositoryArchivo";
import { LoteRepositoryArchivo } from "./LoteRepositoryArchivo";
export class VentaRepositoryArchivo {

    private ruta: string;

    constructor(
        private usuarioRepo: UsuarioRepositoryArchivo,
        private loteRepo: LoteRepositoryArchivo,
    ) {
        this.ruta = path.resolve("src/Infraestructura/Data/ventas.json");
    }

    // ================= UTILIDADES =================

    private leerArchivo(): any[] {

        if (!fs.existsSync(this.ruta)) {
            fs.writeFileSync(this.ruta, "[]");
        }

        const data = fs.readFileSync(this.ruta, "utf-8");
        return JSON.parse(data);
    }

    private escribirArchivo(data: any[]): void {
        fs.writeFileSync(this.ruta, JSON.stringify(data, null, 2));
    }

    // ================= MAPEAR =================

    private mapearVenta(obj: any, lotes: any[], asesores: any[]): Venta {
        // Buscar el lote real (con métodos) usando loteId
        const loteReal = lotes.find(l => l.getIdLote() === obj.loteId);
        // Buscar el asesor real (con métodos) usando asesorId
        const asesorReal = asesores.find(a => a.getId() === obj.asesorId) as Asesor;

        // Reconstruir cliente plano (no necesita métodos de dominio para reportes)
        const cliente = new Cliente(
            obj.cliente.id,
            obj.cliente.nombre,
            obj.cliente.dni,
            obj.cliente.telefono,
            obj.cliente.direccion
        );

        const venta = Venta.reconstruirDesdeJSON({
            ...obj,
            lote:   loteReal,
            asesor: asesorReal,
            cliente
        });

        return venta;
    }

    // ================= MÉTODOS PÚBLICOS =================

    public obtenerTodos(): Venta[] {
        const lotes    = this.loteRepo.obtenerTodos();
        const usuarios = this.usuarioRepo.obtenerTodos();
        const asesores = usuarios.filter(u => u.getTipo() === TipoUsuario.ASESOR);
        return this.leerArchivo().map(obj => this.mapearVenta(obj, lotes, asesores));
    }

    public guardar(venta: Venta): void {

    const data = this.leerArchivo();
    const plan = venta.getPlanPago();

    data.push({
        id: venta.getIdVenta(),
        cliente: {
            id: venta.getCliente().getId(),
            nombre: venta.getCliente().getNombre(),
            dni: venta.getCliente().getDni(),
            telefono: venta.getCliente().getTelefono(),
            direccion: venta.getCliente().getDireccion()
        },
        asesorId: venta.getAsesor().getId(),
        loteId: venta.getLote().getIdLote(),
        tipo: venta.getTipo(),
        tasaInteresDiaria: plan ? plan.getTasaInteresDiaria() : 0,
        numeroCuotas: plan ? plan.getNumeroCuotas() : 0,
        fecha: venta.getFecha(),
        estado: venta.getEstado()
    });

    this.escribirArchivo(data);
    }

    public eliminar(id: number): void {
        const data = this.leerArchivo().filter(v => v.id !== id);
        this.escribirArchivo(data);
    }
}