import express from "express";
import path from "path";
import { SistemaInmobiliario } from "./Aplicacion/services/SistemaInmobiliario";
import { UsuarioRepositoryArchivo } from "./Infraestructura/Repositories/UsuarioRepositoryArchivo";
import { LoteRepositoryArchivo } from "./Infraestructura/Repositories/LoteRepositoryArchivo";
import { VentaRepositoryArchivo } from "./Infraestructura/Repositories/VentaRepositoryArchivo";

const app = express();
app.use(express.json());

// ===== INICIALIZAR REPOS =====
const usuarioRepo = new UsuarioRepositoryArchivo();
const loteRepo = new LoteRepositoryArchivo();
const ventaRepo = new VentaRepositoryArchivo(usuarioRepo, loteRepo);

// ===== SISTEMA =====
const sistema = new SistemaInmobiliario(
    usuarioRepo,
    loteRepo,
    ventaRepo
);

// ===== RUTAS =====

// LOGIN
app.post("/api/login", (req, res) => {

    const { usuario, contraseña } = req.body;

    const resultado = sistema.auth.login(usuario, contraseña);

    res.json(resultado);
});

// OBTENER LOTES
app.get("/api/lotes", (req, res) => {

    const lotes = loteRepo.obtenerTodos();

    res.json(lotes.map(l => ({
        id: l.getIdLote(),
        nombre: l.getNombre(),
        precio: l.getPrecio(),
        estado: l.getEstado()
    })));
});

// CREAR VENTA
app.post("/api/ventas", (req, res) => {

    try {

        const { asesorId, clienteId, loteId, tipo, numeroCuotas } = req.body;

        const usuarios = usuarioRepo.obtenerTodos();
        const asesor = usuarios.find(u => u.getId() === asesorId);

        if (!asesor) {
            return res.status(400).json({ mensaje: "Asesor no encontrado" });
        }

        const venta = sistema.crearVenta(
            asesor as any,
            clienteId,
            loteId,
            tipo,
            numeroCuotas
        );

        res.json({
            mensaje: "Venta creada",
            idVenta: venta.getIdVenta()
        });

    } catch (error: any) {
        res.status(400).json({ mensaje: error.message });
    }
});

// ===== FRONTEND =====
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});