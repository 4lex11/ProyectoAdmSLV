import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CasoComun {
  id_caso: number;
  sistema: string;
  tipo: string;
  problema: string;
  mensaje_sistema: string | null;
  causa: string;
  solucion: string;
  palabras_clave: string;
  fecha_registro: string;
}

export async function buscarCaso(
  sistemaId: string,
  consulta: string
): Promise<CasoComun | null> {
  try {
    const { data, error } = await supabase
      .from("casos_comunes")
      .select("*")
      .eq("sistema", sistemaId.toUpperCase());

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const casos = data as CasoComun[];
    const consultaNormalizada = consulta.toLowerCase();
    const palabrasConsulta = consultaNormalizada
      .split(/\s+/)
      .filter((p) => p.length > 2);

    let mejorCaso: CasoComun | null = null;
    let mejorScore = 0;

    for (const caso of casos) {
      let score = 0;

      const problemaNormalizado = caso.problema.toLowerCase();
      for (const palabra of palabrasConsulta) {
        if (problemaNormalizado.includes(palabra)) {
          score += 10;
        }
      }

      const palabrasClave = caso.palabras_clave
        .toLowerCase()
        .split(",")
        .map((p) => p.trim());

      for (const palabra of palabrasConsulta) {
        for (const pk of palabrasClave) {
          if (pk.includes(palabra) && palabra.length > 2) {
            score += 5;
          }
        }
      }

      if (
        problemaNormalizado.includes(consultaNormalizada.substring(0, 20))
      ) {
        score += 15;
      }

      if (score > mejorScore) {
        mejorScore = score;
        mejorCaso = caso;
      }
    }

    if (mejorScore > 0) {
      if (mejorCaso) {
        console.log(
          `✓ Caso encontrado con score: ${mejorScore}`,
          mejorCaso.problema
        );
        return mejorCaso;
      }
    }

    console.log("✗ No se encontró caso con score suficiente");
    return null;
  } catch (error) {
    console.error("Error buscando caso:", error);
    return null;
  }
}

export async function guardarReporte(
  idCaso: number,
  sistema: string,
  consultaUser: string,
  respuestaBot: string,
  resuelto: boolean
): Promise<string | null> {
  try {
    const idChat = `chat-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const { error } = await supabase.from("reporte_chat").insert([
      {
        id_chat: idChat,
        id_caso: idCaso,
        sistema: sistema,
        consulta_user: consultaUser,
        respuesta_bot: respuestaBot,
        resuelto: resuelto,
      },
    ]);

    if (error) throw error;
    return idChat;
  } catch (error) {
    console.error("Error guardando reporte:", error);
    return null;
  }
}