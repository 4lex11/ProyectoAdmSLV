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

// Obtener total de chats
export async function getTotalChats(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("reporte_chat")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting total chats:", error);
    return 0;
  }
}

// Obtener chats resueltos
export async function getChatsResueltos(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("reporte_chat")
      .select("*", { count: "exact", head: true })
      .eq("resuelto", true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting resolved chats:", error);
    return 0;
  }
}

// Obtener chats sin resolver
export async function getChatsSinResolver(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("reporte_chat")
      .select("*", { count: "exact", head: true })
      .eq("resuelto", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting unresolved chats:", error);
    return 0;
  }
}

// Obtener todas las métricas
export async function getMetricas() {
  try {
    const totalChats = await getTotalChats();
    const chatsResueltos = await getChatsResueltos();
    const chatsSinResolver = await getChatsSinResolver();

    const porcentajeResueltos = totalChats > 0 
      ? ((chatsResueltos / totalChats) * 100).toFixed(2) 
      : "0";

    return {
      totalChats,
      chatsResueltos,
      chatsSinResolver,
      porcentajeResueltos,
    };
  } catch (error) {
    console.error("Error getting metrics:", error);
    return {
      totalChats: 0,
      chatsResueltos: 0,
      chatsSinResolver: 0,
      porcentajeResueltos: "0",
    };
  }
}

// Obtener chats por hora (últimas 24 horas)
export async function getChatsPorHora() {
  try {
    const { data, error } = await supabase
      .from("reporte_chat")
      .select("created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Agrupar por hora
    const horas: { [key: string]: number } = {};
    data?.forEach((chat: any) => {
      if (chat.created_at) {
        const fecha = new Date(chat.created_at);
        const hora = fecha.getHours();
        const horaKey = `${hora.toString().padStart(2, "0")}:00`;
        horas[horaKey] = (horas[horaKey] || 0) + 1;
      }
    });

    // Convertir a formato para gráfico
    const result = Array.from({ length: 24 }, (_, i) => {
      const horaKey = `${i.toString().padStart(2, "0")}:00`;
      return {
        time: horaKey,
        chats: horas[horaKey] || 0,
      };
    });

    return result;
  } catch (error) {
    console.error("Error getting chats por hora:", error);
    return [];
  }
}

// Obtener chats no resueltos como "incidentes activos"
export async function getIncidentesActivos() {
  try {
    const { data, error } = await supabase
      .from("reporte_chat")
      .select("id_chat, sistema, consulta_user, created_at")
      .eq("resuelto", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return (
      data?.map((chat: any, index: number) => ({
        id: chat.id_chat,
        title: chat.consulta_user.substring(0, 50) + "...",
        severity:
          index === 0 ? "critical" : index === 1 ? "high" : "medium",
        duration: calcularDuracion(chat.created_at),
        sistema: chat.sistema,
      })) || []
    );
  } catch (error) {
    console.error("Error getting incidentes activos:", error);
    return [];
  }
}

// Obtener estadísticas por sistema
export async function getEstadisticasPorSistema() {
  try {
    const sistemas = ["SVL", "RETCC", "REMYPE", "RENOCC"];
    const result = [];

    for (const sistema of sistemas) {
      const { count: total, error: errorTotal } = await supabase
        .from("reporte_chat")
        .select("*", { count: "exact", head: true })
        .eq("sistema", sistema);

      const { count: resueltos, error: errorResueltos } = await supabase
        .from("reporte_chat")
        .select("*", { count: "exact", head: true })
        .eq("sistema", sistema)
        .eq("resuelto", true);

      if (!errorTotal && !errorResueltos) {
        const porcentaje =
          total && total > 0 ? ((resueltos || 0) / total) * 100 : 0;
        result.push({
          service: sistema,
          p50: Math.floor((total || 0) * 0.1),
          p95: Math.floor((total || 0) * 0.5),
          p99: Math.floor((resueltos || 0)),
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error getting estadísticas por sistema:", error);
    return [];
  }
}

// Función auxiliar para calcular duración
function calcularDuracion(fecha: string): string {
  const ahora = new Date();
  const creado = new Date(fecha);
  const diff = Math.floor((ahora.getTime() - creado.getTime()) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

// Obtener conteo de chats sin resolver (incidentes)
export async function getIncidentesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("reporte_chat")
      .select("*", { count: "exact", head: true })
      .eq("resuelto", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting incidentes count:", error);
    return 0;
  }
}

// Obtener conteo de chats resueltos (solucionados)
export async function getSolucionadosCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("reporte_chat")
      .select("*", { count: "exact", head: true })
      .eq("resuelto", true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting solucionados count:", error);
    return 0;
  }
}

// Obtener información del usuario (si tienes tabla de usuarios)
// Cambia esto según tu estructura de usuarios
export async function getCurrentUser() {
  try {
    // Opción 1: Si usas Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      return {
        nombre: user.user_metadata?.nombre || "Usuario",
        apellido: user.user_metadata?.apellido || "",
        email: user.email || "",
        initials: `${(user.user_metadata?.nombre || "U")[0]}${(user.user_metadata?.apellido || "S")[0]}`,
      };
    }

    // Opción 2: Si tienes tabla de usuarios
    const { data } = await supabase
      .from("usuarios")
      .select("nombre, apellido, email")
      .single();

    if (data) {
      return {
        nombre: data.nombre || "Usuario",
        apellido: data.apellido || "",
        email: data.email || "",
        initials: `${(data.nombre || "U")[0]}${(data.apellido || "S")[0]}`.toUpperCase(),
      };
    }

    // Fallback
    return {
      nombre: "Usuario",
      apellido: "",
      email: "user@example.com",
      initials: "US",
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return {
      nombre: "Usuario",
      apellido: "",
      email: "user@example.com",
      initials: "US",
    };
  }
}

