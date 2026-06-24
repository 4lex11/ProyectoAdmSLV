"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Section } from "@/app/dashboard/page";
import {
  LayoutDashboard,
  AlertTriangle,
  Rocket,
  MessageCircleCheck,
  Bug,
  Shield,
  Phone,
  Server,
  FileText,
  Settings,
  Search,
  Moon,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getIncidentesCount, getSolucionadosCount, getCurrentUser } from "@/lib/supabase";

interface AppSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

interface NavItem {
  id: Section;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: "red" | "yellow" | "green";
}

interface UserData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  email: string;
  initials: string;
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const [incidentes, setIncidentes] = useState(0);
  const [solucionados, setSolucionados] = useState(0);
  const [usuario, setUsuario] = useState<UserData>({
    nombre: "Usuario",
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombreCompleto: "Usuario",
    email: "usuario@example.com",
    initials: "US",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      const [incCount, solCount, userData] = await Promise.all([
        getIncidentesCount(),
        getSolucionadosCount(),
        getCurrentUser(),
      ]);
      setIncidentes(incCount);
      setSolucionados(solCount);
      setUsuario(userData);
      setCargando(false);
    };

    cargarDatos();
  }, []);

  const mainMenu: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { 
      id: "incidents", 
      label: "Incidentes", 
      icon: AlertTriangle, 
      badge: incidentes, 
      badgeColor: "red" 
    },
    { 
      id: "deployments", 
      label: "Solucionados", 
      icon: MessageCircleCheck, 
      badge: solucionados,
      badgeColor: "green"
    },
  ];

  return (
    <aside className="w-[260px] h-screen bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
        <Image src="/LogoMTPE.png" alt="Logo MTPE" width={250} height={300} />
      </div>
      <br></br>
      {/* Main Menu */}
      <div className="px-4 flex-1">
        <p className="px-2 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          OPERACIONES
        </p>
        <nav className="space-y-0.5">
          {mainMenu.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Settings & User */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        <NavButton
          item={{ id: "settings", label: "Configuracion", icon: Settings }}
          isActive={activeSection === "settings"}
          onClick={() => onSectionChange("settings")}
        />
        
        {/* User Profile */}
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-chart-1/20 flex items-center justify-center">
            <span className="text-chart-1 text-sm font-medium">{usuario.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {usuario.nombreCompleto}
            </p>
            <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
          </div>
          <button 
            type="button"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            <Moon className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  const Icon = item.icon;
  
  const badgeColorClass = {
    red: "bg-destructive/15 text-destructive",
    yellow: "bg-warning/20 text-warning",
    green: "bg-success/15 text-success",
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-primary text-primary-foreground font-medium shadow-sm"
          : "text-foreground/80 hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && (
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isActive
              ? "bg-primary-foreground/20 text-primary-foreground"
              : item.badgeColor 
                ? badgeColorClass[item.badgeColor]
                : "bg-muted text-muted-foreground"
          )}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}