import { guardarReporte } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { idCaso, sistema, consultaUser, respuestaBot, resuelto } = await request.json();

    if (!idCaso || !sistema || !consultaUser || !respuestaBot) {
      return new Response(
        JSON.stringify({
          error: 'Parámetros requeridos: idCaso, sistema, consultaUser, respuestaBot, resuelto',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const idChat = await guardarReporte(
      idCaso,
      sistema,
      consultaUser,
      respuestaBot,
      resuelto || false
    );

    if (!idChat) {
      return new Response(
        JSON.stringify({ error: 'No se pudo guardar el reporte' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        idChat,
        message: 'Reporte guardado exitosamente',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en save-reporte:', error);
    return new Response(
      JSON.stringify({ error: 'Error al guardar el reporte' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}