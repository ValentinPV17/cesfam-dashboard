import { NextResponse } from 'next/server';

export async function GET() {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return NextResponse.json(
      { error: 'Falta la variable de entorno APPS_SCRIPT_URL. Sigue los pasos del README para configurar el Apps Script.' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(appsScriptUrl, {
      next: { revalidate: 30 },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error('Apps Script error:', res.status, await res.text());
      return NextResponse.json({ error: 'Error al consultar el Apps Script' }, { status: 502 });
    }

    const registros = await res.json();

    return NextResponse.json(registros, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Error en /api/registros:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
