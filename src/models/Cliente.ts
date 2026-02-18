export class Cliente {
    constructor(
        private id: number,
        private nombre: string,
        private dni: string,
        private direccion: string,
        private telefono: string
    ) {

        if (!nombre || nombre.trim() === "") {
            throw new Error("El nombre es obligatorio.");
        }

        // Validar DNI: exactamente 8 dígitos numéricos
        const dniRegex = /^[0-9]{8}$/;
        if (!dniRegex.test(dni)) {
            throw new Error("El DNI debe tener exactamente 8 dígitos numéricos.");
        }

        // Validar teléfono: exactamente 9 dígitos numéricos
        const telefonoRegex = /^[0-9]{9}$/;
        if (!telefonoRegex.test(telefono)) {
            throw new Error("El teléfono debe tener exactamente 9 dígitos numéricos.");
        }

        if (!direccion || direccion.trim() === "") {
            throw new Error("La dirección es obligatoria.");
        }
    }

    public getId(): number {
        return this.id;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public getDni(): string {
        return this.dni;
    }

    public getDireccion(): string {
        return this.direccion;
    }

    public getTelefono(): string {
        return this.telefono;
    }
}