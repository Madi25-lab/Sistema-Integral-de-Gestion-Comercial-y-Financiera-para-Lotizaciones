import { Lote } from "../../Dominio/models/Lote";

export class LoteRepositoryMemoria {

    private lotes: Lote[] = [];

    guardar(lote: Lote): void {
        this.lotes.push(lote);
    }

    obtenerTodos(): Lote[] {
        return this.lotes;
    }

    buscarPorId(id: number): Lote | undefined {
        return this.lotes.find(l => l.getIdLote() === id);
    }
}