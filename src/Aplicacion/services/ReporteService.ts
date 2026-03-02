import { Venta } from "../../Dominio/models/Venta";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { Usuario } from "../../Dominio/models/Usuario";
import { Asesor } from "../../Dominio/models/Asesor";

export class ReporteService{

    constructor(
        private ventas:Venta[],
        private asesores:Asesor[]
    ){}

    public obtenerTotalVentas(usuario: Usuario): number {
    
        if (usuario.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede ver reportes.");
        }
    
        return this.ventas.length;
    }
    
        public obtenerIngresosTotales(usuario: Usuario): number {
    
        if (usuario.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede ver reportes.");
        }
    
        return this.ventas
            .filter(v => v.estaCompletamentePagada())
            .reduce((total, v) => total + v.getTotal(), 0);
    }
    
        public obtenerAsesorConMasVentas(usuario: Usuario): Asesor | null {
    
        if (usuario.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede ver reportes.");
        }
    
        if (this.asesores.length === 0) return null;
    
        let asesorTop: Asesor | null = null;
        let maxVentas = 0;
    
        for (const asesor of this.asesores) {
    
            const cantidad = this.ventas.filter(v =>
                v.getAsesor().getId() === asesor.getId()
            ).length;
    
            if (cantidad > maxVentas) {
                maxVentas = cantidad;
                asesorTop = asesor;
            }
        }
    
        return asesorTop;
    }

}