import { NextResponse } from 'next/server';

export async function GET() {
  const spreadsheetId = process.env.SPREADSHEET_ID_REGISTRO;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!spreadsheetId || !apiKey) {
    return NextResponse.json(
      { error: 'Faltan variables de entorno: GOOGLE_SHEETS_API_KEY y SPREADSHEET_ID_REGISTRO' },
      { status: 500 }
    );
  }

  const range = encodeURIComponent('Hoja 1!A:H');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      const text = await res.text();
      console.error('Google Sheets API error:', text);
      return NextResponse.json({ error: 'Error al consultar Google Sheets' }, { status: 502 });
    }

    const data = await res.json();
    const rows: string[][] = data.values ?? [];

    if (rows.length <= 1) return NextResponse.json([]);

    const registros = rows
      .slice(1)
      .filter(row => row.length > 2 && row[2]?.trim())
      .map((row, i) => ({
        id: String(i),
        emailUsuario: row[1]?.trim() ?? '',
        nombre: row[2]?.trim() ?? '',
        motivo: row[3]?.trim() ?? '',
        horaSalida: row[4]?.trim() ?? '',
        horaLlegada: row[5]?.trim() ?? '',
        duracionViaje: row[6]?.trim() ?? '',
        especificarMotivo: row[7]?.trim() ?? '',
      }));

    return NextResponse.json(registros, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Error en /api/registros:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
