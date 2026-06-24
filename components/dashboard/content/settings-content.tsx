"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function SettingsContent() {
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [iniciales, setIniciales] = useState("--");
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);

      // 1. Obtener email del usuario autenticado
      const { data: authData } = await supabase.auth.getUser();
      const emailAuth = authData?.user?.email ?? "";
      setEmail(emailAuth);
      console.log("📧 Email autenticado:", emailAuth);

      // 2. Traer TODOS los usuarios para debug
      const { data: todos } = await supabase.from("usuarios").select("*");
      console.log("👥 Todos los usuarios en tabla:", todos);

      // 3. Buscar por gmail sin .single()
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido_paterno, apellido_materno, gmail")
        .eq("gmail", emailAuth);

      console.log("🔍 Resultado búsqueda por gmail:", data, "Error:", error);

      if (!data || data.length === 0) {
        console.warn("⚠️ No se encontró usuario con gmail:", emailAuth);
        setCargando(false);
        return;
      }

      const usuario = data[0];
      setUsuarioId(usuario.id);
      setNombre(usuario.nombre ?? "");
      setApellidoPaterno(usuario.apellido_paterno ?? "");
      setApellidoMaterno(usuario.apellido_materno ?? "");

      const ini = `${(usuario.nombre ?? "U")[0]}${(usuario.apellido_paterno ?? "S")[0]}`.toUpperCase();
      setIniciales(ini);
      setCargando(false);
    };

    cargar();
  }, []);

  const handleGuardar = async () => {
    if (!usuarioId) return;
    setGuardando(true);
    setMensaje(null);

    const { error } = await supabase
      .from("usuarios")
      .update({
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
      })
      .eq("id", usuarioId);

    setGuardando(false);

    if (error) {
      console.error("Error guardando:", error);
      setMensaje({ tipo: "error", texto: "Error al guardar. Intenta de nuevo." });
    } else {
      const ini = `${(nombre ?? "U")[0]}${(apellidoPaterno ?? "S")[0]}`.toUpperCase();
      setIniciales(ini);
      setMensaje({ tipo: "ok", texto: "Datos actualizados correctamente." });
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-6">Configuración de usuario</h3>

        {cargando ? (
          <div className="flex items-center gap-3 text-muted-foreground text-sm py-8">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            Cargando datos...
          </div>
        ) : (
          <div className="flex items-start gap-6">
            {/* Campos */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Apellido Paterno</label>
                <input
                  type="text"
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Apellido Materno</label>
                <input
                  type="text"
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">El correo no puede modificarse.</p>
              </div>

              {/* Aviso si no se encontró el usuario */}
              {!usuarioId && (
                <p className="text-sm text-warning">
                  No se encontró tu usuario en la base de datos. Verifica que el gmail coincida.
                </p>
              )}

              {mensaje && (
                <p className={`text-sm font-medium ${mensaje.tipo === "ok" ? "text-success" : "text-destructive"}`}>
                  {mensaje.texto}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleGuardar} disabled={guardando || !usuarioId}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}