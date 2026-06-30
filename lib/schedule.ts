export interface ActividadProgramada {
  nombre: string;
  horasSemana: number;
  keywords: string[];
}

export interface VehiculoProgramado {
  registroNombre: string;
  horasContratadas: number;
  actividades: ActividadProgramada[];
}

// Extraído de Hoja3 del archivo programacion 2026.xlsx
export const HORARIO_MAESTRO: VehiculoProgramado[] = [
  {
    registroNombre: 'FURGON INSTITUCIONAL',
    horasContratadas: 39,
    actividades: [
      { nombre: 'ATENCION EN DOMICILIO / PROGRAMA PAD', horasSemana: 29, keywords: ['PAD'] },
      { nombre: 'PROCEDIMIENTO EN DOMICILIO TENS', horasSemana: 5, keywords: ['TENS'] },
      { nombre: 'VISITA MEDICO ECICEP AMARILLO', horasSemana: 1, keywords: ['ECICEP', 'AMARILLO'] },
      { nombre: 'VISITA MEDICO ECICEP VERDE', horasSemana: 1, keywords: ['ECICEP', 'VERDE'] },
      { nombre: 'VISITA MEDICO ECICEP AZUL', horasSemana: 1, keywords: ['ECICEP', 'AZUL'] },
    ],
  },
  {
    registroNombre: 'CAMIONETA',
    horasContratadas: 39,
    actividades: [
      { nombre: 'ENTREGA MUESTRAS CLINICA A HOSCA', horasSemana: 4, keywords: ['ENTREGA', 'MUESTRA'] },
      { nombre: 'TOMA DE MUESTRAS ECICEP A DOMICILIO', horasSemana: 3, keywords: ['TOMA', 'MUESTRA'] },
      { nombre: 'TRASLADO DE CATRES', horasSemana: 4, keywords: ['CATRE'] },
      { nombre: 'TRASLADO SEDE', horasSemana: 2, keywords: ['SEDE'] },
      { nombre: 'VISITAS SERVICIO SOCIAL SECTOR AMARILLO', horasSemana: 2, keywords: ['SOCIAL', 'AMARILLO'] },
      { nombre: 'VISITA DOMICILIARIA PAD MEDICO', horasSemana: 3, keywords: ['PAD', 'MEDICO'] },
      { nombre: 'VISITA SECTOR AZUL', horasSemana: 3, keywords: ['SECTOR', 'AZUL'] },
      { nombre: 'VISITA DOMICILIARIA PAD ENFERMERA', horasSemana: 3, keywords: ['PAD', 'ENFERMERA'] },
      { nombre: 'TRANSVERSAL IRA / ERA', horasSemana: 3, keywords: ['IRA'] },
      { nombre: 'RESCATE GES', horasSemana: 0, keywords: ['GES'] },
      { nombre: 'PAPS', horasSemana: 4, keywords: ['PAPS'] },
    ],
  },
  {
    registroNombre: 'MINI VAN',
    horasContratadas: 25,
    actividades: [
      { nombre: 'PROGRAMA CPNU', horasSemana: 25, keywords: ['CPNU'] },
      { nombre: 'ECICEP', horasSemana: 2, keywords: ['ECICEP'] },
      { nombre: 'ENTREGA DE FLUJOS', horasSemana: 1, keywords: ['FLUJO'] },
    ],
  },
  {
    registroNombre: 'AUTO',
    horasContratadas: 0,
    actividades: [
      { nombre: 'VISITA SECTOR AMARILLO', horasSemana: 3, keywords: ['SECTOR', 'AMARILLO'] },
      { nombre: 'VISITA SECTOR VERDE', horasSemana: 3, keywords: ['SECTOR', 'VERDE'] },
      { nombre: 'VISITAS SERVICIO SOCIAL SECTOR VERDE', horasSemana: 3, keywords: ['SOCIAL', 'VERDE'] },
      { nombre: 'PASMI / PMAS', horasSemana: 4, keywords: ['PASMI'] },
      { nombre: 'RESCATE GES', horasSemana: 0, keywords: ['GES'] },
      { nombre: 'SDGP', horasSemana: 2, keywords: ['SDGP'] },
    ],
  },
];
