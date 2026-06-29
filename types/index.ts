export interface Registro {
  id: string;
  emailUsuario: string;
  nombre: string;
  motivo: string;
  horaSalida: string;
  horaLlegada: string;
  duracionViaje: string;
  especificarMotivo: string;
}

export interface RegistroParsed extends Registro {
  horaSalidaDate: Date | null;
  horaLlegadaDate: Date | null;
  enRuta: boolean;
  duracionMinutos: number;
}
