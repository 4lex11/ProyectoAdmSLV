"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, User, Search, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
export { SolucionadosContent as DeploymentsContent };

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CasoResuelto {
  id_chat: string;
  id_caso: number | null;
  sistema: string;
  consulta_user: string;
  respuesta_bot: string;
  resuelto: boolean;
  created_at: string;
  // Campos derivados para la UI
  duracion: string;
  tipoLabel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tiempoTranscurrido(fechaISO: string): string {
  const diff = Date.now() - new Date(fechaISO).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  return `${Math.floor(hrs / 24)} d`;
}

const SISTEMAS = ["SVL", "RETCC", "REMYPE", "RENOCC"];

const PIE_COLORS = [
  "oklch(0.55 0.18 250)",
  "oklch(0.65 0.15 180)",
  "oklch(0.60 0.20 140)",
  "oklch(0.58 0.16 310)",
];

const cardShadow =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px";

// ─── Funciones Supabase ───────────────────────────────────────────────────────

async function getCasosResueltos(): Promise<CasoResuelto[]> {
  const { data, error } = await supabase
    .from("reporte_chat")
    .select("*")
    .eq("resuelto", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo casos resueltos:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    duracion: tiempoTranscurrido(row.created_at),
    tipoLabel: row.sistema ?? "General",
  }));
}

async function getTotalResueltos(): Promise<number> {
  const { count, error } = await supabase
    .from("reporte_chat")
    .select("*", { count: "exact", head: true })
    .eq("resuelto", true);

  if (error) return 0;
  return count ?? 0;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SolucionadosContent() {
  const [casos, setCasos] = useState<CasoResuelto[]>([]);
  const [seleccionado, setSeleccionado] = useState<CasoResuelto | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSistema, setFiltroSistema] = useState<string>("all");
  const [barData, setBarData] = useState<Array<{ sistema: string; count: number }>>([]);
  const [pieData, setPieData] = useState<Array<{ name: string; value: number }>>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [casosData, totalData] = await Promise.all([
          getCasosResueltos(),
          getTotalResueltos(),
        ]);

        setCasos(casosData);
        setTotal(totalData);

        if (casosData.length > 0) setSeleccionado(casosData[0]);

        // Contar por sistema
        const countMap: Record<string, number> = {};
        SISTEMAS.forEach((s) => (countMap[s] = 0));
        casosData.forEach((c) => {
          const key = c.sistema?.toUpperCase();
          if (key && countMap[key] !== undefined) countMap[key]++;
        });

        const bar = SISTEMAS.map((s) => ({ sistema: s, count: countMap[s] }));
        const pie = SISTEMAS.filter((s) => countMap[s] > 0).map((s) => ({
          name: s,
          value: countMap[s],
        }));

        setBarData(bar);
        setPieData(pie);
      } catch (err) {
        console.error("Error cargando casos resueltos:", err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // Filtrado local
  const casosFiltrados = casos.filter((c) => {
    const coincideSistema =
      filtroSistema === "all" || c.sistema?.toUpperCase() === filtroSistema;
    const coincideBusqueda =
      busqueda === "" ||
      c.consulta_user?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.sistema?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideSistema && coincideBusqueda;
  });

  // ── Estado de carga ──
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando casos resueltos...</p>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (!cargando && casos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          Aún no hay casos resueltos
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Cuando el chatbot resuelva consultas aparecerán aquí con todos sus detalles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Resueltos</p>
              <p className="text-3xl font-bold text-foreground">{total}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-success/20" />
          </div>
        </div>

        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sistema con más casos</p>
              <p className="text-3xl font-bold text-foreground">
                {barData.reduce((a, b) => (b.count > a.count ? b : a), { sistema: "—", count: 0 }).sistema}
              </p>
            </div>
            <Award className="w-12 h-12 text-success/20" />
          </div>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Barras */}
        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <h3 className="text-base font-semibold text-foreground mb-1">
            Resueltos por sistema
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Total de consultas cerradas</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.005 250)"
                  vertical={false}
                />
                <XAxis
                  dataKey="sistema"
                  tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }}
                  axisLine={{ stroke: "oklch(0.92 0.005 250)" }}
                />
                <YAxis
                  tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }}
                  axisLine={{ stroke: "oklch(0.92 0.005 250)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid oklch(0.92 0.005 250)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [value, "Casos"]}
                />
                <Bar
                  dataKey="count"
                  fill="oklch(0.60 0.17 160)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie */}
        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <h3 className="text-base font-semibold text-foreground mb-1">
            Distribución
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Proporción por sistema</p>
          <div className="h-[200px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid oklch(0.92 0.005 250)",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number) => [value, "Casos"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sin datos suficientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por consulta o sistema..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2">
          {["all", ...SISTEMAS].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltroSistema(s)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                filtroSistema === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista + Detalle ── */}
      <div className="flex gap-6 h-[calc(100vh-580px)] min-h-[360px]">

        {/* Lista */}
        <div className="w-[400px] flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {casosFiltrados.length > 0 ? (
              casosFiltrados.map((caso) => (
                <button
                  key={caso.id_chat}
                  type="button"
                  onClick={() => setSeleccionado(caso)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all",
                    seleccionado?.id_chat === caso.id_chat
                      ? "bg-card border-success/40 shadow-md"
                      : "bg-card border-border hover:border-success/20"
                  )}
                  style={{
                    boxShadow:
                      seleccionado?.id_chat === caso.id_chat ? cardShadow : "none",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    {/* Badge sistema */}
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-success/10 text-success">
                      {caso.sistema ?? "—"}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {caso.duracion}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                    {caso.consulta_user}
                  </p>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {caso.respuesta_bot}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No se encontraron casos
              </div>
            )}
          </div>
        </div>

        {/* Detalle */}
        {seleccionado && (
          <div
            className="flex-1 bg-card rounded-2xl border border-border p-6 overflow-y-auto"
            style={{ boxShadow: cardShadow }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 text-xs font-semibold uppercase rounded-full bg-success/10 text-success">
                    Resuelto
                  </span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                    {seleccionado.sistema}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {seleccionado.id_chat}
                </p>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Tiempo</p>
                <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {seleccionado.duracion}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                <p className="text-lg font-semibold text-foreground">
                  {seleccionado.sistema ?? "—"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Caso relacionado</p>
                <p className="text-lg font-semibold text-foreground">
                  {seleccionado.id_caso ? `#${seleccionado.id_caso}` : "General"}
                </p>
              </div>
            </div>

            {/* Consulta del usuario */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Consulta del usuario
              </h3>
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-sm text-foreground leading-relaxed">
                  {seleccionado.consulta_user}
                </p>
              </div>
            </div>

            {/* Respuesta del bot */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Solución brindada
              </h3>
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <p className="text-sm text-foreground leading-relaxed">
                  {seleccionado.respuesta_bot}
                </p>
              </div>
            </div>

            {/* Línea de tiempo */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Línea de tiempo
              </h3>
              <div className="space-y-3">
                {/* Inicio */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">Consulta recibida</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(seleccionado.created_at).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Resolución */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">Caso resuelto por el chatbot</p>
                    <p className="text-xs text-muted-foreground">
                      Confirmado por el usuario
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}