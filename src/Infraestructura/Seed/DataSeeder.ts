import { Jefe } from "../../Dominio/models/Jefe";
import { Asesor } from "../../Dominio/models/Asesor";
import { Zona } from "../../Dominio/enums/Zona";
import { TipoDistribucion } from "../../Dominio/enums/TipoDistribucion";
import { Lote } from "../../Dominio/models/Lote";
import { UsuarioRepositoryMemoria } from "../Repositories/UsuarioRepositoryMemoria";
import { LoteRepositoryMemoria } from "../Repositories/LoteRepositoryMemoria";

export class DataSeeder {

    static poblar(
        usuarioRepo: UsuarioRepositoryMemoria,
        loteRepo: LoteRepositoryMemoria
    ): void {

        // ===== JEFE =====
        const jefe = new Jefe(1, "Administrador", "admin", "1234");
        usuarioRepo.guardar(jefe);

        // ===== ASESORES =====
        const asesor1 = new Asesor(2, "Juan Perez", "juan", "123");
        const asesor2 = new Asesor(3, "Maria Lopez", "maria", "123");

        usuarioRepo.guardar(asesor1);
        usuarioRepo.guardar(asesor2);

        // ===== LOTES =====
        const lote1 = new Lote(
            1,
            "Lote A1",
            100,
            "Mz A Lt 1",
            Zona.A,
            TipoDistribucion.ESQUINA,
            200
        );

        const lote2 = new Lote(
            2,
            "Lote B1",
            120,
            "Mz B Lt 1",
            Zona.B,
            TipoDistribucion.AVENIDA,
            180
        );

        loteRepo.guardar(lote1);
        loteRepo.guardar(lote2);
    }
}