"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, User, CheckCircle, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getIncidentesActivos, getChatsSinResolver } from "@/lib/supabase";

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "investigating" | "mitigating" | "monitoring" | "resolved";
  duration: string;
  assignee: string;
  assigneeInitials: string;
  impactedServices: string[];
  timeline: Array<{
    time: string;
    event: string;
    type: "alert" | "notification" | "action";
  }>;
  sistema: string;
}

const statusConfig = {
  investigating: { label: "Investigando", color: "bg-warning/20 text-warning" },
  mitigating: { label: "Mitigando", color: "bg-chart-1/20 text-chart-1" },
  monitoring: { label: "Monitoreando", color: "bg-info/20 text-info" },
  resolved: { label: "Resuelto", color: "bg-success/20 text-success" },
};

const severityConfig = {
  critical: { label: "Crítico", color: "bg-destructive text-destructive-foreground" },
  high: { label: "Alto", color: "bg-warning/20 text-warning" },
  medium: { label: "Medio", color: "bg-muted text-muted-foreground" },
  low: { label: "Bajo", color: "bg-muted text-muted-foreground" },
};

const cardShadow = "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px";

export function IncidentsContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [chartsData, setChartsData] = useState<Array<{ sistema: string; count: number }>>([]);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarIncidentes = async () => {
      try {
        setCargando(true);
        
        // Obtener incidentes activos y contar
        const incidentesActivos = await getIncidentesActivos();
        const totalSinResolver = await getChatsSinResolver();
        
        setTotalIncidents(totalSinResolver);

        // Mapear a estructura de Incident
        const incidentsFormateados: Incident[] = incidentesActivos.map((item: any, index: number) => ({
          id: item.id || `INC-${2846 + index}`,
          title: item.title,
          description: `Problema sin resolver en sistema ${item.sistema}`,
          severity: item.severity === "critical" ? "critical" : item.severity === "high" ? "high" : "medium",
          status: "investigating",
          duration: item.duration,
          assignee: "Equipo Soporte",
          assigneeInitials: "ES",
          impactedServices: [item.sistema],
          timeline: [
            {
              time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
              event: "Incidente reportado",
              type: "alert",
            },
          ],
          sistema: item.sistema,
        }));

        setIncidents(incidentsFormateados);
        if (incidentsFormateados.length > 0) {
          setSelectedIncident(incidentsFormateados[0]);
        }

        // Contar incidentes por sistema - INCLUYENDO TODOS LOS SISTEMAS
        const sistemasDisponibles = ["SVL", "RETCC", "REMYPE", "RENOCC"];
        const countPorSistema: { [key: string]: number } = {};
        
        // Inicializar con 0 para todos los sistemas
        sistemasDisponibles.forEach((sistema) => {
          countPorSistema[sistema] = 0;
        });
        
        // Contar incidentes reales
        incidentsFormateados.forEach((inc) => {
          const sistemaUpper = inc.sistema.toUpperCase();
          countPorSistema[sistemaUpper] = (countPorSistema[sistemaUpper] || 0) + 1;
        });

        // Crear datos para el gráfico
        const chartData = sistemasDisponibles.map((sistema) => ({
          sistema: sistema,
          count: countPorSistema[sistema] || 0,
        }));

        setChartsData(chartData);
      } catch (error) {
        console.error("Error cargando incidentes:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarIncidentes();
  }, []);

  const filteredIncidents = filterStatus === "all" 
    ? incidents 
    : incidents.filter(i => i.status === filterStatus);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando incidentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas y Gráfico */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total de Incidentes */}
        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Incidentes</p>
              <p className="text-3xl font-bold text-foreground">{totalIncidents}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-destructive/20" />
          </div>
        </div>

        {/* Incidentes Críticos */}
        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Incidentes Críticos</p>
              <p className="text-3xl font-bold text-destructive">
                {incidents.filter((i) => i.severity === "critical").length}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-destructive/20" />
          </div>
        </div>
      </div>

      {/* Gráfico de Incidentes por Sistema */}
      <div
        className="bg-card rounded-2xl p-6 border border-border"
        style={{ boxShadow: cardShadow }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Incidentes por Sistema</h3>
            <p className="text-sm text-muted-foreground">Distribución de casos sin resolver</p>
          </div>
        </div>
        <div className="h-[240px]">
          {chartsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid oklch(0.92 0.005 250)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.55 0.18 250)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Lista e Detalles */}
      <div className="flex gap-6 h-[calc(100vh-500px)]">
        {/* Incidents List */}
        <div className="w-[400px] flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => setSelectedIncident(incident)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all",
                    selectedIncident?.id === incident.id
                      ? "bg-card border-primary/30 shadow-md"
                      : "bg-card border-border hover:border-primary/20"
                  )}
                  style={{
                    boxShadow:
                      selectedIncident?.id === incident.id ? cardShadow : "none",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full",
                        severityConfig[incident.severity].color
                      )}
                    >
                      {severityConfig[incident.severity].label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {incident.id}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                    {incident.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium rounded-full",
                        statusConfig[incident.status].color
                      )}
                    >
                      {statusConfig[incident.status].label}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {incident.duration}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No hay incidentes
              </div>
            )}
          </div>
        </div>

        {/* Incident Detail */}
        {selectedIncident && (
          <div
            className="flex-1 bg-card rounded-2xl border border-border p-6 overflow-y-auto"
            style={{ boxShadow: cardShadow }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold uppercase rounded-full",
                      severityConfig[selectedIncident.severity].color
                    )}
                  >
                    {severityConfig[selectedIncident.severity].label}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full",
                      statusConfig[selectedIncident.status].color
                    )}
                  >
                    {statusConfig[selectedIncident.status].label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  {selectedIncident.title}
                </h2>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedIncident.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Duración</p>
                <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {selectedIncident.duration}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Equipo</p>
                <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-chart-1/20 flex items-center justify-center text-xs font-medium text-chart-1">
                    {selectedIncident.assigneeInitials}
                  </div>
                  {selectedIncident.assignee}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                <p className="text-lg font-semibold text-foreground">
                  {selectedIncident.sistema}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Descripción
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Servicios Impactados
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedIncident.impactedServices.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1.5 text-xs font-medium bg-muted rounded-lg text-foreground"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Línea de Tiempo</h3>
              <div className="space-y-3">
                {selectedIncident.timeline.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        entry.type === "alert"
                          ? "bg-destructive/10"
                          : entry.type === "notification"
                          ? "bg-warning/10"
                          : "bg-success/10"
                      )}
                    >
                      {entry.type === "alert" ? (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      ) : entry.type === "notification" ? (
                        <User className="w-4 h-4 text-warning" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-foreground">{entry.event}</p>
                      <p className="text-xs text-muted-foreground">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}