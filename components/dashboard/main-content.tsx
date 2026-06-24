"use client";

import { useRouter } from "next/navigation";
import type { Section } from "@/app/dashboard/page";
import { OverviewContent } from "./content/overview-content";
import { IncidentsContent } from "./content/incidents-content";
import { DeploymentsContent } from "./content/deployments-content";
import { PerformanceContent } from "./content/performance-content";
import { ErrorsContent } from "./content/errors-content";
import { SlaContent } from "./content/sla-content";
import { OncallContent } from "./content/oncall-content";
import { ServicesContent } from "./content/services-content";
import { PostmortemsContent } from "./content/postmortems-content";
import { SettingsContent } from "./content/settings-content";
import { Bell, Calendar, RefreshCw, Plus, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

interface MainContentProps {
  activeSection: Section;
}

const sectionConfig: Record<Section, { title: string; subtitle: string }> = {
  overview: {
    title: "System Overview",
    subtitle: "Real-time Engineering Metrics",
  },
  incidents: {
    title: "Incidents",
    subtitle: "Active & Recent Incidents",
  },
  deployments: {
    title: "Deployments",
    subtitle: "Release Pipeline & History",
  },
  performance: {
    title: "Performance",
    subtitle: "System Latency & Throughput",
  },
  errors: {
    title: "Error Tracking",
    subtitle: "Exceptions & Error Rates",
  },
  sla: {
    title: "SLA & Uptime",
    subtitle: "Service Level Monitoring",
  },
  oncall: {
    title: "On-Call",
    subtitle: "Schedule & Response Metrics",
  },
  services: {
    title: "Services",
    subtitle: "Service Catalog & Health",
  },
  postmortems: {
    title: "Postmortems",
    subtitle: "Incident Reports & Learnings",
  },
  settings: {
    title: "Settings",
    subtitle: "Configuration & Integrations",
  },
};

export function MainContent({ activeSection }: MainContentProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const config = sectionConfig[activeSection];

  const handleLogout = async () => {
    try {
      setCargando(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión");
        return;
      }

      // Redirigir a login
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error");
    } finally {
      setCargando(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewContent />;
      case "incidents":
        return <IncidentsContent />;
      case "deployments":
        return <DeploymentsContent />;
      case "performance":
        return <PerformanceContent />;
      case "errors":
        return <ErrorsContent />;
      case "sla":
        return <SlaContent />;
      case "oncall":
        return <OncallContent />;
      case "services":
        return <ServicesContent />;
      case "postmortems":
        return <PostmortemsContent />;
      case "settings":
        return <SettingsContent />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-card shrink-0">
        <div></div>

        <div className="flex items-center gap-3">
          {/* Logout Button */}
          <Button 
            size="sm" 
            className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={handleLogout}
            disabled={cargando}
          >
            <LogOut className="w-4 h-4" />
            <span>{cargando ? "Cerrando..." : "Cerrar Sesión"}</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div key={activeSection} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}