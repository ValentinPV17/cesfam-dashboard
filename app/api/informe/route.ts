import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
  convertInchesToTwip,
} from 'docx';

interface BodyData {
  vehiculo: string;
  desde: string;
  hasta: string;
  periodoNombre: string;
  horarioAM: string;
  horarioPM: string;
  horasSemanalesAM: string;
  horasSemanalesPM: string;
  incluirAM: boolean;
  incluirPM: boolean;
}

interface Registro {
  nombre: string;
  motivo: string;
  horaSalida: string;
  horaLlegada: string;
  duracionViaje: string;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1], +m[4], +m[5], +m[6]);
  const d = new Date(str);
  return isNaN(d.getTime()) || d.getFullYear() < 1950 ? null : d;
}

function parseDurMinutes(str: string): number {
  if (!str) return 0;
  const m1 = str.match(/^(\d+):(\d{2})/);
  if (m1) { const h = +m1[1]; return h > 20 ? 0 : h * 60 + +m1[2]; }
  const m2 = str.match(/\s(\d{1,2}):(\d{2}):\d{2}\s/);
  if (m2) { const h = +m2[1]; return h > 20 ? 0 : h * 60 + +m2[2]; }
  return 0;
}

function fmtHours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function pct(num: number, den: number): string {
  if (den === 0) return '0%';
  return `${Math.round((num / den) * 100)}%`;
}

function analisisPorActividad(actividad: string, porcentaje: number): string {
  const nivel = porcentaje >= 80
    ? `El ${porcentaje}% de utilización refleja una adecuada planificación y cumplimiento de las horas programadas. Este nivel indica una buena coordinación del recurso humano y alta demanda de actividades planificadas.`
    : porcentaje >= 50
    ? `El ${porcentaje}% de utilización indica un uso moderado del recurso. Se recomienda revisar la programación para optimizar los tiempos disponibles y reducir horas sin uso.`
    : `El ${porcentaje}% de utilización sugiere una subutilización del recurso programado. Esto puede atribuirse a cancelaciones, baja demanda u otras causas. Se recomienda evaluar la programación y realizar seguimiento semanal por el encargado del programa.`;
  return `${actividad}: ${nivel}`;
}

function conclusiones(actividadesAltas: string[], actividadesBajas: string[]): string[] {
  const list: string[] = [];
  actividadesAltas.forEach(a => list.push(`Mantener la estrategia actual en ${a}, dado su alto nivel de cumplimiento.`));
  actividadesBajas.forEach(a =>
    list.push(`Evaluar las causas de baja utilización en ${a}, implementando acciones correctivas: revisión de cartera, ajuste de programación según demanda real y monitoreo semanal.`)
  );
  if (list.length === 0) list.push('Continuar con el monitoreo regular del recurso vehicular.');
  return list;
}

// Table helpers
const borderNone = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const borderThin = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: '1E3A5F', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })],
    })],
  });
}

function dataCell(text: string, width: number, bold = false, center = false): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    borders: { top: borderThin, bottom: borderThin, left: borderNone, right: borderNone },
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, bold, size: 20, font: 'Calibri' })],
    })],
  });
}

function metaRow(label: string, value: string): TableRow {
  return new TableRow({ children: [
    new TableCell({
      width: { size: 3000, type: WidthType.DXA },
      shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      borders: { top: borderThin, bottom: borderThin, left: borderNone, right: borderNone },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Calibri' })] })],
    }),
    new TableCell({
      width: { size: 7000, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      borders: { top: borderThin, bottom: borderThin, left: borderNone, right: borderNone },
      children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Calibri' })] })],
    }),
  ]});
}

export async function POST(req: NextRequest) {
  const body: BodyData = await req.json();
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) return NextResponse.json({ error: 'APPS_SCRIPT_URL no configurado' }, { status: 500 });

  // Fetch data
  const sheetRes = await fetch(appsScriptUrl);
  if (!sheetRes.ok) return NextResponse.json({ error: 'No se pudo obtener datos de Google Sheets' }, { status: 502 });
  const allRegistros: Registro[] = await sheetRes.json();

  const desde = new Date(body.desde + 'T00:00:00');
  const hasta = new Date(body.hasta + 'T23:59:59');

  // Filter by vehicle and date range
  const registros = allRegistros.filter(r => {
    if (r.nombre !== body.vehiculo) return false;
    const d = parseDate(r.horaSalida);
    if (!d) return false;
    return d >= desde && d <= hasta;
  });

  // Number of weeks in period
  const diffMs = hasta.getTime() - desde.getTime();
  const weeks = Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));

  const horasSemanalesAM = parseFloat(body.horasSemanalesAM) || 0;
  const horasSemanalesPM = parseFloat(body.horasSemanalesPM) || 0;
  const horasProgramadasAM = body.incluirAM ? horasSemanalesAM * weeks * 60 : 0; // in minutes
  const horasProgramadasPM = body.incluirPM ? horasSemanalesPM * weeks * 60 : 0;
  const horasProgramadasTotal = horasProgramadasAM + horasProgramadasPM;

  // Calculate usage per motivo
  const motivoMap: Record<string, { minAM: number; minPM: number; count: number }> = {};
  let totalMinAM = 0, totalMinPM = 0;

  registros.forEach(r => {
    const motivo = r.motivo || 'SIN MOTIVO';
    const d = parseDate(r.horaSalida);
    const min = parseDurMinutes(r.duracionViaje);
    if (!motivoMap[motivo]) motivoMap[motivo] = { minAM: 0, minPM: 0, count: 0 };
    motivoMap[motivo].count++;
    const hora = d ? d.getHours() : 0;
    if (hora < 13) { motivoMap[motivo].minAM += min; totalMinAM += min; }
    else { motivoMap[motivo].minPM += min; totalMinPM += min; }
  });

  const pctAM = Math.round((totalMinAM / Math.max(1, horasProgramadasAM)) * 100);
  const pctPM = Math.round((totalMinPM / Math.max(1, horasProgramadasPM)) * 100);

  // Sort motivos by total usage
  const motivos = Object.entries(motivoMap)
    .map(([name, v]) => ({ name, total: v.minAM + v.minPM, minAM: v.minAM, minPM: v.minPM, count: v.count }))
    .sort((a, b) => b.total - a.total);

  const actividadesAltas = motivos.filter(m => {
    const p = Math.round((m.total / Math.max(1, horasProgramadasTotal)) * 100);
    return p >= 80;
  }).map(m => m.name);

  const actividadesBajas = motivos.filter(m => {
    const p = Math.round((m.total / Math.max(1, horasProgramadasTotal)) * 100);
    return p < 50;
  }).map(m => m.name);

  // Build DOCX
  const horarioTexto = [
    body.incluirAM ? body.horarioAM : '',
    body.incluirPM ? body.horarioPM : '',
  ].filter(Boolean).join(' y ');

  const resumenTexto = body.incluirAM && body.incluirPM
    ? `El análisis de uso del vehículo en el periodo evaluado corresponde a un ${pctAM}% en el horario AM y de un ${pctPM}% en horario PM. La siguiente tabla indica el uso por actividad programada para dicho móvil.`
    : body.incluirAM
    ? `El análisis de uso del vehículo en el periodo evaluado corresponde a un ${pctAM}% en el horario AM. La siguiente tabla indica el uso por actividad programada para dicho móvil.`
    : `El análisis de uso del vehículo en el periodo evaluado corresponde a un ${pctPM}% en el horario PM. La siguiente tabla indica el uso por actividad programada para dicho móvil.`;

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
        },
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'INFORME TÉCNICO', bold: true, size: 28, font: 'Calibri', color: '1E3A5F' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'EVALUACIÓN DE UTILIZACIÓN DE HORAS PROGRAMADAS', bold: true, size: 24, font: 'Calibri', color: '1E3A5F' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: body.vehiculo, bold: true, size: 24, font: 'Calibri', color: '1E3A5F' })],
        }),

        // Metadata table
        new Table({
          width: { size: 9840, type: WidthType.DXA },
          rows: [
            metaRow('Periodo Evaluado:', body.periodoNombre),
            metaRow('Fuente de Información:', `Bitácora móvil ${body.vehiculo.toLowerCase()}`),
            metaRow('Horarios programados:', horarioTexto),
            metaRow('Total de viajes registrados:', `${registros.length} viajes`),
          ],
        }),

        new Paragraph({ spacing: { before: 300, after: 200 }, children: [new TextRun({ text: '1. Resumen de Datos', bold: true, size: 24, font: 'Calibri', color: '1E3A5F' })] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: resumenTexto, size: 20, font: 'Calibri' })] }),

        // Activity table
        new Table({
          width: { size: 9840, type: WidthType.DXA },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell('Actividad', 4500),
                headerCell('Horas utilizadas', 2000),
                headerCell('N° viajes', 1500),
                headerCell('% Uso', 1840),
              ],
            }),
            ...motivos.map(m => {
              const p = Math.round((m.total / Math.max(1, horasProgramadasTotal)) * 100);
              return new TableRow({ children: [
                dataCell(m.name, 4500),
                dataCell(fmtHours(m.total), 2000, false, true),
                dataCell(String(m.count), 1500, false, true),
                dataCell(`${p}%`, 1840, false, true),
              ]});
            }),
            new TableRow({ children: [
              dataCell('TOTAL', 4500, true),
              dataCell(fmtHours(totalMinAM + totalMinPM), 2000, true, true),
              dataCell(String(registros.length), 1500, true, true),
              dataCell(pct(totalMinAM + totalMinPM, horasProgramadasTotal), 1840, true, true),
            ]}),
          ],
        }),

        new Paragraph({ spacing: { before: 300, after: 200 }, children: [new TextRun({ text: '2. Análisis Técnico', bold: true, size: 24, font: 'Calibri', color: '1E3A5F' })] }),
        ...motivos.map(m => {
          const p = Math.round((m.total / Math.max(1, horasProgramadasTotal)) * 100);
          return new Paragraph({
            spacing: { after: 160 },
            children: [new TextRun({ text: analisisPorActividad(m.name, p), size: 20, font: 'Calibri' })],
          });
        }),

        new Paragraph({ spacing: { before: 300, after: 200 }, children: [new TextRun({ text: '3. Conclusiones y Recomendaciones', bold: true, size: 24, font: 'Calibri', color: '1E3A5F' })] }),
        ...conclusiones(actividadesAltas, actividadesBajas).map((c, i) =>
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: `${i + 1}. ${c}`, size: 20, font: 'Calibri' })],
          })
        ),

        new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `Informe generado automáticamente desde el sistema de Control de Vehículos CESFAM — ${new Date().toLocaleDateString('es-CL')}`, size: 16, font: 'Calibri', color: '888888', italics: true })] }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);
  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Informe_${body.vehiculo.replace(/ /g, '_')}.docx"`,
    },
  });
}
