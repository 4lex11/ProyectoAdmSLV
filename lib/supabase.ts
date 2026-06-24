import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============= INTERFACES =============
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

export interface Usuario {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  gmail: string;
}

// ============= USUARIOS =============

export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return {
        id: null,
        nombre: "Sin sesión",
        apellidoPaterno: "",
        apellidoMaterno: "",
        nombreCompleto: "Sin sesión",
        email: "",
        initials: "SS",
      };
    }

    // Leer desde tabla usuarios por gmail
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido_paterno, apellido_materno, gmail")
      .eq("gmail", user.email);

    if (error || !data || data.length === 0) {
      console.warn("⚠️ Usuario no encontrado en tabla usuarios:", user.email);
      // Fallback: usar email como nombre
      const fallbackNombre = user.email.split("@")[0];
      return {
        id: null,
        nombre: fallbackNombre,
        apellidoPaterno: "",
        apellidoMaterno: "",
        nombreCompleto: fallbackNombre,
        email: user.email,
        initials: fallbackNombre[0].toUpperCase() + "U",
      };
    }

    const u = data[0];
    const nombreCompleto = `${u.nombre} ${u.apellido_paterno} ${u.apellido_materno}`.trim();
    const initials = `${(u.nombre ?? "U")[0]}${(u.apellido_paterno ?? "S")[0]}`.toUpperCase();

    return {
      id: u.id,
      nombre: u.nombre ?? "",
      apellidoPaterno: u.apellido_paterno ?? "",
      apellidoMaterno: u.apellido_materno ?? "",
      nombreCompleto,
      email: u.gmail ?? "",
      initials,
    };
  } catch (error) {
    console.error("❌ Error getting current user:", error);
    return {
      id: null,
      nombre: "Error",
      apellidoPaterno: "",
      apellidoMaterno: "",
      nombreCompleto: "Error",
      email: "",
      initials: "ER",
    };
  }
}

export async function actualizarUsuario(
  id: number,
  nombre: string,
  apellidoPaterno: string,
  apellidoMaterno: string
): Promise<boolean> {
  const { error } = await supabase
    .from("usuarios")
    .update({
      nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno,
    })
    .eq("id", id);

  if (error) {
    console.error("❌ Error actualizando usuario:", error);
    return false;
  }
  return true;
}

// Mantenida por compatibilidad con LoginPage
export async function actualizarMetadatasAlLogin(
  nombre: string,
  apellidoPaterno: string,
  apellidoMaterno: string
) {
  try {
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user?.email) return false;

    const { error } = await supabase
      .from("usuarios")
      .update({
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
      })
      .eq("gmail", user.email);

    if (error) {
      console.error("❌ Error actualizando metadata:", error);
      return false;
    }

    setTimeout(() => window.location.reload(), 500);
    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

// ============= BÚSQUEDA DE CASOS =============
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
        if (problemaNormalizado.includes(palabra)) score += 10;
      }

      const palabrasClave = caso.palabras_clave
        .toLowerCase()
        .split(",")
        .map((p) => p.trim());

      for (const palabra of palabrasConsulta) {
        for (const pk of palabrasClave) {
          if (pk.includes(palabra) && palabra.length > 2) score += 5;
        }
      }

      if (problemaNormalizado.includes(consultaNormalizada.substring(0, 20))) {
        score += 15;
      }

      if (score > mejorScore) {
        mejorScore = score;
        mejorCaso = caso;
      }
    }

    if (mejorScore > 0 && mejorCaso) {
      console.log(`✓ Caso encontrado con score: ${mejorScore}`, mejorCaso.problema);
      return mejorCaso;
    }

    console.log("✗ No se encontró caso con score suficiente");
    return null;
  } catch (error) {
    console.error("Error buscando caso:", error);
    return null;
  }
}

// ============= GUARDAR REPORTE =============
export async function guardarReporte(
  idCaso: number,
  sistema: string,
  consultaUser: string,
  respuestaBot: string,
  resuelto: boolean
): Promise<string | null> {
  try {
    const idChat = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase.from("reporte_chat").insert([
      {
        id_chat: idChat,
        id_caso: idCaso,
        sistema,
        consulta_user: consultaUser,
        respuesta_bot: respuestaBot,
        resuelto,
      },
    ]);

    if (error) throw error;
    return idChat;
  } catch (error) {
    console.error("Error guardando reporte:", error);
    return null;
  }
}

// ============= MÉTRICAS GENERALES =============
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

export async function getMetricas() {
  try {
    const totalChats = await getTotalChats();
    const chatsResueltos = await getChatsResueltos();
    const chatsSinResolver = await getChatsSinResolver();
    const porcentajeResueltos =
      totalChats > 0
        ? ((chatsResueltos / totalChats) * 100).toFixed(2)
        : "0";

    return { totalChats, chatsResueltos, chatsSinResolver, porcentajeResueltos };
  } catch (error) {
    console.error("Error getting metrics:", error);
    return { totalChats: 0, chatsResueltos: 0, chatsSinResolver: 0, porcentajeResueltos: "0" };
  }
}

// ============= GRÁFICOS =============
export async function getChatsPorHora() {
  try {
    const { data, error } = await supabase
      .from("reporte_chat")
      .select("created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const horas: { [key: string]: number } = {};
    data?.forEach((chat: any) => {
      if (chat.created_at) {
        const hora = new Date(chat.created_at).getHours();
        const horaKey = `${hora.toString().padStart(2, "0")}:00`;
        horas[horaKey] = (horas[horaKey] || 0) + 1;
      }
    });

    return Array.from({ length: 24 }, (_, i) => {
      const horaKey = `${i.toString().padStart(2, "0")}:00`;
      return { time: horaKey, chats: horas[horaKey] || 0 };
    });
  } catch (error) {
    console.error("Error getting chats por hora:", error);
    return [];
  }
}

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
        severity: index === 0 ? "critical" : index === 1 ? "high" : "medium",
        duration: calcularDuracion(chat.created_at),
        sistema: chat.sistema,
      })) || []
    );
  } catch (error) {
    console.error("Error getting incidentes activos:", error);
    return [];
  }
}

export async function getEstadisticasPorSistema() {
  try {
    // Una sola query para todos los registros
    const { data, error } = await supabase
      .from("reporte_chat")
      .select("sistema, resuelto");

    if (error) throw error;

    const sistemas = ["SVL", "RETCC", "REMYPE", "RENOCC"];
    const map: Record<string, { total: number; resueltos: number }> = {};
    sistemas.forEach((s) => (map[s] = { total: 0, resueltos: 0 }));

    data?.forEach((row: any) => {
      const key = row.sistema?.toUpperCase();
      if (map[key]) {
        map[key].total++;
        if (row.resuelto) map[key].resueltos++;
      }
    });

    return sistemas.map((s) => ({
      service: s,
      total: map[s].total,
      resueltos: map[s].resueltos,
      sinResolver: map[s].total - map[s].resueltos,
    }));
  } catch (error) {
    console.error("Error getting estadísticas por sistema:", error);
    return [];
  }
}

// ============= SIDEBAR =============
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

// ============= HELPERS =============
function calcularDuracion(fecha: string): string {
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}