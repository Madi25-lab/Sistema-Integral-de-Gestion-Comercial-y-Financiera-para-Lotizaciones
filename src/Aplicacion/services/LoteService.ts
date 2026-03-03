import { Lote } from "../../Dominio/models/Lote";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { Usuario } from "../../Dominio/models/Usuario";
import { Zona } from "../../Dominio/enums/Zona";
import { TipoDistribucion } from "../../Dominio/enums/TipoDistribucion";

export class LoteService{

    private contadorLotes: number = 1;

    constructor(private lotes:Lote[]){
    this.contadorLotes = lotes.length > 0
        ? Math.max(...lotes.map(l => l.getIdLote())) + 1
        : 1;
    }
    
    public registrarLote(
        usuario: Usuario,
        nombre: string,
        tamanio: number,
        ubicacion: string,
        zona: Zona,
        tipoDistribucion: TipoDistribucion,
        precio: number
    ): Lote {
        
        // 🔒 Validación de permiso
        if (usuario.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede registrar lotes.");
        }

        // 🔒 Evitar duplicados por nombre
        const existe = this.lotes.some(l => l.getNombre() === nombre);

        if (existe) {
            throw new Error("Ya existe un lote con ese nombre.");
        }

        const nuevoLote = new Lote(
            this.contadorLotes++,
            nombre,
            tamanio,
            ubicacion,
            zona,
            tipoDistribucion,
            precio
        );

        this.lotes.push(nuevoLote);

        return nuevoLote;
    }
    
    public getLotes(): Lote[] {
        return this.lotes;
    }
}