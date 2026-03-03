const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos de frontend

// Datos simulados en memoria
let asesores = [
    { id: 1, usuario: 'admin', contraseña: '1234', nombre: 'Asesor Admin' }
];
let clientes = [];
let lotes = [
    { id: 1, nombre: "Lote 1", precio: 10000, estado: "Disponible" },
    { id: 2, nombre: "Lote 2", precio: 12000, estado: "Disponible" },
    { id: 3, nombre: "Lote 3", precio: 9000, estado: "Disponible" }
];
let ventas = [];

// LOGIN
app.post('/api/login', (req, res) => {
    const { usuario, contraseña } = req.body;
    const asesor = asesores.find(a => a.usuario === usuario && a.contraseña === contraseña);
    if (asesor) {
        res.json({ exito: true, usuario: asesor.id, nombre: asesor.nombre });
    } else {
        res.json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
});

// LOTES
app.get('/api/lotes', (req, res) => res.json(lotes));

// CLIENTES
app.post('/api/clientes', (req, res) => {
    const { id, nombre } = req.body;
    if (!id || !nombre) return res.json({ exito: false, mensaje: 'Completa todos los campos' });
    if (clientes.find(c => c.id === id)) return res.json({ exito: false, mensaje: 'Cliente ya registrado' });
    clientes.push({ id, nombre });
    res.json({ exito: true, cliente: { id, nombre } });
});

app.get('/api/clientes', (req, res) => res.json(clientes));

// VENTAS
app.post('/api/ventas', (req, res) => {
    const { asesorId, clienteId, loteId, tipo, numeroCuotas } = req.body;
    const lote = lotes.find(l => l.id === loteId);
    if (!lote || lote.estado !== 'Disponible') return res.json({ exito: false, mensaje: 'Lote no disponible' });
    if (!clientes.find(c => c.id === clienteId)) return res.json({ exito: false, mensaje: 'Cliente no registrado' });
    
    const idVenta = ventas.length + 1;
    ventas.push({ idVenta, asesorId, clienteId, loteId, tipo, numeroCuotas });
    lote.estado = 'Vendido';
    res.json({ exito: true, idVenta });
});

app.get('/api/ventas', (req, res) => res.json(ventas));

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));