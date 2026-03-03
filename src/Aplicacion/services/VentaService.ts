import { Venta } from "../../Dominio/models/Venta";
import { VentaHistorica } from "../../Dominio/models/VentaHistorica";
import { Usuario } from "../../Dominio/models/Usuario";
import { TipoUsuario } from "../../Dominio/enums/TipoUsuario";
import { TipoVenta } from "../../Dominio/enums/TipoVenta";
import { Lote } from "../../Dominio/models/Lote";
import { Cliente } from "../../Dominio/models/Cliente";
import { Asesor } from "../../Dominio/models/Asesor";
import { EstadoVenta } from "../../Dominio/enums/EstadoVenta";

export class VentaService{

    private contadorVentas: number = 1;
    private historialVentas:VentaHistorica[]=[]

    constructor(
    private ventas: Venta[],
    private lotes:Lote[],
    private clientes:Cliente[],
    private tasaInteresDiariaGlobal:number,
    private porcentajePenalidad:number
){
    this.contadorVentas = ventas.length > 0
        ? Math.max(...ventas.map(v => v.getIdVenta())) + 1
        : 1;
}

    private verificarAsesor(usuario: Usuario): Asesor {

        if (usuario.getTipo() !== TipoUsuario.ASESOR) {
            throw new Error("Solo el asesor puede crear ventas.");
        }

        return usuario as Asesor;
    }

    public crearVenta(
        usuario: Usuario,
        clienteId: number,
        loteId: number,
        tipo: TipoVenta,
        numeroCuotas?: number
    ): Venta {

    const asesor = this.verificarAsesor(usuario);

    const cliente = asesor.buscarClientePorId(clienteId);
    if (!cliente) {
        throw new Error("Cliente no encontrado.");
    }

    const lote = this.lotes.find(l => l.getIdLote() === loteId);
    if (!lote) {
        throw new Error("Lote no encontrado.");
    }

    if (!lote.estaDisponible()) {
        throw new Error("El lote no está disponible.");
    }

    // ✅ SOLO reservar
    lote.reservar();

    const venta = new Venta(
        this.contadorVentas++,
        asesor,
        cliente,
        lote,
        tipo,
        this.tasaInteresDiariaGlobal,
        numeroCuotas
    );

    this.ventas.push(venta);
    asesor.agregarVenta(venta);

        // ==========================================
        // 🔒 CREAR REGISTRO HISTÓRICO INMUTABLE
        // ==========================================
    
        const detalles = tipo === TipoVenta.FINANCIADO
            ? `Venta financiada en ${numeroCuotas} cuotas`
            : "Venta al contado";
    
        const ventaHistorica = new VentaHistorica(
            venta.getIdVenta(),
            cliente.getNombre(),
            asesor.getNombre(),
            new Date(),
            tipo.toString(),
            lote.getPrecio(), // precio congelado
            detalles
    );
    
        this.historialVentas.push(ventaHistorica);

    return venta;
    }

    public obtenerHistorialVentas(usuario: Usuario): VentaHistorica[] {
        
        if (usuario.getTipo() !== TipoUsuario.JEFE) {
            throw new Error("Solo el jefe puede ver el historial.");
            }
        
            return [...this.historialVentas];
        }

    public anularVenta(idVenta: number): void {

    const venta = this.ventas.find(v => v.getIdVenta() === idVenta);

    if (!venta) {
        throw new Error("Venta no encontrada.");
    }

    if (venta.getEstado() === EstadoVenta.ANULADA) {
        throw new Error("La venta ya fue anulada.");
    }

    if (venta.getEstado() === EstadoVenta.COMPLETADA) {
        throw new Error("No se puede anular una venta completada.");
    }

    const cliente = venta.getCliente();
    const idCliente = cliente.getId();

    // Ejecuta lógica de anulación
    venta.anularVenta(this.porcentajePenalidad);

    // Guardar en historial
    this.historialVentas.push(
        new VentaHistorica(
            venta.getIdVenta(),
            venta.getCliente().getNombre(),
            venta.getAsesor().getNombre(),
            new Date(),
            venta.getTipo(),
            venta.getTotal(),
            "Venta anulada"
        )
    );

    // Eliminar venta activa
    const indexVenta = this.ventas.findIndex(v => v.getIdVenta() === idVenta);
    if (indexVenta !== -1) {
        this.ventas.splice(indexVenta, 1);
    }

    // Eliminar cliente si no tiene más ventas
    const tieneOtraVenta = this.ventas.some(v =>
        v.getCliente().getId() === idCliente
    );

    if (!tieneOtraVenta) {
        const indexCliente = this.clientes.findIndex(c => c.getId() === idCliente);
        if (indexCliente !== -1) {
            this.clientes.splice(indexCliente, 1);
        }
    }
}

}