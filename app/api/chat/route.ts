import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, systemId } = await request.json();

    // Validar que los mensajes existan
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mapeo de IDs a nombres de sistemas
    const systemNames: Record<string, string> = {
      svl: 'Seguro Vida Ley (SVL)',
      retcc: 'Registro de Trabajadores Sujetos a Inspección Periódica de Seguridad (RETCC)',
      remype: 'Registro de Micro y Pequeñas Empresas (REMYPE)',
      renocc: 'Registro de Trabajadores de Hogar',
    };

    const systemName = systemNames[systemId] || 'el sistema';

    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: `Eres un asistente virtual de soporte técnico del Ministerio de Trabajo y Promoción del Empleo (MTPE) del Perú.
      
El usuario está consultando sobre: ${systemName}

INSTRUCCIONES IMPORTANTES:
1. Responde de forma clara, concisa y profesional en español peruano.
2. Solo responde preguntas relacionadas al sistema indicado: ${systemName}
3. Si la pregunta está fuera del contexto del sistema, indica amablemente que solo puedes ayudar con consultas sobre ${systemName}
4. Proporciona información útil, enlaces (si es relevante) y pasos claros cuando sea necesario.
5. Sé empático y útil en todas tus respuestas.
6. Si no tienes información específica, sugiere al usuario contactar a RRHH o al equipo de soporte del MTPE.`,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
