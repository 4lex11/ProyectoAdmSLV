import { buscarCaso } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { sistema, consulta } = await request.json();

    if (!sistema || !consulta) {
      return new Response(
        JSON.stringify({ error: 'Parámetros requeridos: sistema, consulta' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const caso = await buscarCaso(sistema, consulta);

    if (!caso) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se encontró una solución para tu problema. Por favor, intenta describir el inconveniente con más detalle o contacta a soporte.',
          caso: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        caso: {
          id_caso: caso.id_caso,
          problema: caso.problema,
          solucion: caso.solucion,
          causa: caso.causa,
          mensaje_sistema: caso.mensaje_sistema,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en search-casos:', error);
    return new Response(
      JSON.stringify({ error: 'Error al buscar el caso' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}