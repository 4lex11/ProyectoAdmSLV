"use client";
import { login } from "@/services/auth.service";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  const { data, error } = await login(email, password);

  if (error) {
    setError(error.message);
  } else {
    console.log("Login correcto:", data);

    router.replace("/dashboard");
  }

  setIsLoading(false);
};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="h-16 px-6 flex items-center border-b border-border">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
            <Image src="/LogoMTPE.png" alt="Logo MTPE" width={250} height={300} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-scale-in">
          {/* Card Container */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {/* Title Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Bienvenido de vuelta
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground block">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all duration-200"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground block">
                    Contraseña
                  </label>
                  <Link href="/forgot-password" className="text-xs text-chart-1 hover:text-chart-1/80 transition-colors">
                    olvidaste la contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded-md border border-border bg-input checked:bg-primary checked:border-primary accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground/80">Recuerdame</span>
              </label>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-slide-up">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-6 text-sm text-center text-foreground/80">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-chart-1 hover:text-chart-1/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
