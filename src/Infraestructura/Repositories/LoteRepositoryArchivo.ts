import fs from "fs";
import path from "path";
import { Lote } from "../../Dominio/models/Lote";

export class LoteRepositoryArchivo {

    private ruta: string;

    constructor() {
        this.ruta = path.resolve("src/Infraestructura/Data/lotes.json");
    }

    // =========================
    // UTILIDADES
    // =========================

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

    private mapearLote(obj: any): Lote {

    const lote = new Lote(
        obj.id,
        obj.nombre,
        obj.tamanio,
        obj.ubicacion,
        obj.zona,
        obj.tipoDistribucion,
        obj.precio
    );

    // Reconstrucción correcta respetando flujo del dominio
    if (obj.estado === "RESERVADO") {
        lote.reservar();
    }

    if (obj.estado === "EN_FINANCIAMIENTO") {
        lote.reservar();
        lote.activarFinanciamiento();
    }

    if (obj.estado === "VENDIDO") {
        lote.reservar();
        lote.activarFinanciamiento();
        lote.marcarVendido();
    }

        return lote;
    }

    // =========================
    // MÉTODOS PÚBLICOS
    // =========================

    public obtenerTodos(): Lote[] {
        return this.leerArchivo().map(obj => this.mapearLote(obj));
    }

    public buscarPorId(id: number): Lote | undefined {
        return this.obtenerTodos()
            .find(l => l.getIdLote() === id);
    }

    public guardar(lote: Lote): void {

        const data = this.leerArchivo();

        data.push({
            id: lote.getIdLote(),
            nombre: lote.getNombre(),
            tamanio: lote.getTamanio(),
            ubicacion: lote.getUbicacion(),
            zona: lote.getZona(),
            tipoDistribucion: lote.getTipoDistribucion(),
            precio: lote.getPrecio(),
            estado: lote.getEstado()
        });

        this.escribirArchivo(data);
    }

    public eliminar(id: number): void {

        const data = this.leerArchivo()
            .filter(l => l.id !== id);

        this.escribirArchivo(data);
    }
}