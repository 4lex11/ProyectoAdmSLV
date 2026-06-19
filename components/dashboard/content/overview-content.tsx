"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Loader,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { getMetricas, getChatsPorHora, getIncidentesActivos, getEstadisticasPorSistema } from "@/lib/supabase";

const requestsData = [
  { time: "00:00", requests: 12400, errors: 45 },
  { time: "04:00", requests: 8200, errors: 23 },
  { time: "08:00", requests: 24500, errors: 89 },
  { time: "12:00", requests: 31200, errors: 124 },
  { time: "16:00", requests: 28900, errors: 98 },
  { time: "20:00", requests: 19800, errors: 67 },
  { time: "Now", requests: 22100, errors: 72 },
];

const latencyData = [
  { service: "API Gateway", p50: 45, p95: 142, p99: 289 },
  { service: "Auth", p50: 23, p95: 67, p99: 134 },
  { service: "Database", p50: 12, p95: 34, p99: 78 },
  { service: "Cache", p50: 2, p95: 8, p99: 15 },
  { service: "CDN", p50: 18, p95: 45, p99: 92 },
];

const activeIncidents = [
  {
    id: "INC-2847",
    title: "Database latency spike in us-east-1",
    severity: "high",
    duration: "23 min",
    assignee: "Sarah M.",
  },
  {
    id: "INC-2846",
    title: "Payment gateway timeout errors",
    severity: "critical",
    duration: "45 min",
    assignee: "Mike C.",
  },
  {
    id: "INC-2845",
    title: "CDN cache invalidation delay",
    severity: "medium",
    duration: "1h 12m",
    assignee: "Lisa P.",
  },
];

const cardShadow = "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px";

export function OverviewContent() {
  const [metricas, setMetricas] = useState({
    totalChats: 0,
    chatsResueltos: 0,
    chatsSinResolver: 0,
    porcentajeResueltos: "0",
  });
  const [chatsPorHora, setChatsPorHora] = useState<Array<{ time: string; chats: number }>>([]);
  const [incidentes, setIncidentes] = useState<Array<{ id: string; title: string; severity: string; duration: string; sistema: string }>>([]);
  const [estadisticasSistema, setEstadisticasSistema] = useState<Array<{ service: string; p50: number; p95: number; p99: number }>>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      const [datos, chats, incs, stats] = await Promise.all([
        getMetricas(),
        getChatsPorHora(),
        getIncidentesActivos(),
        getEstadisticasPorSistema(),
      ]);
      setMetricas(datos);
      setChatsPorHora(chats);
      setIncidentes(incs);
      setEstadisticasSistema(stats);
      setCargando(false);
    };

    cargarDatos();
  }, []);

  const metrics = [
    {
      label: "Chats Terminados",
      value: cargando ? "..." : metricas.totalChats.toString(),
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Chats Solucionados",
      value: cargando ? "..." : metricas.chatsResueltos.toString(),
      change: "+2",
      trend: "up",
      icon: Zap,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Chats sin Solución",
      value: cargando ? "..." : metricas.chatsSinResolver.toString(),
      icon: Activity,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Tasa de Resolución",
      value: cargando ? "..." : `${metricas.porcentajeResueltos}%`,
      change: "+5%",
      trend: "up",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-card rounded-2xl p-5 border border-border"
              style={{ boxShadow: cardShadow }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${metric.bgColor}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    metric.trend === "down"
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">{metric.change}</span>
                </div>
              </div>
              <p className="text-2xl font-semibold text-foreground mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Requests Chart */}
        <div
          className="col-span-2 bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Chats por Hora
              </h3>
              <p className="text-sm text-muted-foreground">Chats en las últimas 24 horas</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1" />
                <span className="text-muted-foreground">Chats</span>
              </div>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chatsPorHora.length > 0 ? chatsPorHora : requestsData}>
                <defs>
                  <linearGradient
                    id="requestsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="oklch(0.55 0.18 250)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.55 0.18 250)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.005 250)"
                />
                <XAxis
                  dataKey="time"
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
                <Area
                  type="monotone"
                  dataKey="chats"
                  stroke="oklch(0.55 0.18 250)"
                  strokeWidth={2}
                  fill="url(#requestsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Incidents */}
        <div
          className="bg-card rounded-2xl p-6 border border-border"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Chats Sin Resolver
            </h3>
            <span className="px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-full">
              {incidentes.length} abiertos
            </span>
          </div>
          <div className="space-y-3">
            {incidentes.length > 0 ? (
              incidentes.map((incident: any) => (
                <div
                  key={incident.id}
                  className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                        incident.severity === "critical"
                          ? "bg-destructive/20 text-destructive"
                          : incident.severity === "high"
                            ? "bg-warning/20 text-warning"
                            : "bg-muted-foreground/20 text-muted-foreground"
                      }`}
                    >
                      {incident.severity}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {incident.sistema}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                    {incident.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {incident.duration}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No hay chats sin resolver
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Latency */}
      <div
        className="bg-card rounded-2xl p-6 border border-border"
        style={{ boxShadow: cardShadow }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Estadísticas por Sistema
            </h3>
            <p className="text-sm text-muted-foreground">
              Total, Resueltos y No Resueltos por Sistema
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <span className="text-muted-foreground">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">Resueltos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-3" />
              <span className="text-muted-foreground">Sin Resolver</span>
            </div>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estadisticasSistema.length > 0 ? estadisticasSistema : latencyData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.92 0.005 250)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }}
                axisLine={{ stroke: "oklch(0.92 0.005 250)" }}
              />
              <YAxis
                dataKey="service"
                type="category"
                tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }}
                axisLine={{ stroke: "oklch(0.92 0.005 250)" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid oklch(0.92 0.005 250)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="p50"
                fill="oklch(0.65 0.15 155)"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="p95"
                fill="oklch(0.55 0.18 250)"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="p99"
                fill="oklch(0.7 0.18 350)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}