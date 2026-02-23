import { EstadoLote } from "../enums/EstadoLote";
import { TipoDistribucion } from "../enums/TipoDistribucion";
import { Zona } from "../enums/Zona";

export class Lote {

    private estado: EstadoLote;
    private precioFinal: number;

    constructor(
        private idLote: number,
        private nombre: string,
        private tamanio: number,
        private ubicacion: string,
        private zona: Zona,
        private tipoDistribucion: TipoDistribucion,
        private precioMetro: number
    ) {

        if (tamanio <= 0) {
            throw new Error("El tamaño debe ser mayor a cero.");
        }

        this.estado = EstadoLote.DISPONIBLE;
        this.precioFinal = this.tamanio * this.precioMetro;
    }

    public getZona(): Zona {
        return this.zona;
    }

    public getTipoDistribucion(): TipoDistribucion {
        return this.tipoDistribucion;
    }

    public getPrecio(): number {
        return this.precioFinal;
    }

    public getTamanio(): number {
        return this.tamanio;
    }

    public getUbicacion(): string {
        return this.ubicacion;
    }

    public getIdLote(): number {
        return this.idLote;
    }

    public getEstado(): EstadoLote {
        return this.estado;
    }

    public reservar(): void {
        if (!this.estaDisponible()) {
            throw new Error("No disponible.");
        }
        this.estado = EstadoLote.RESERVADO;
    }

    public estaDisponible(): boolean {
        return this.estado === EstadoLote.DISPONIBLE;
    }
}