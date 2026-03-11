import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, ShieldCheck } from "lucide-react";
import UpdateUserDialog from "@/components/dialogs/UpdateUserDialog";
import { AppUser } from "@/services/user-service";
import { useState } from "react";
import { Brain, Activity, Sun, Moon, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Derive initials for avatar placeholder
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-7 h-7 text-primary" />
              <Activity className="w-3 h-3 text-accent absolute -top-0.5 -right-1 animate-pulse-glow" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Neuro<span className="text-primary">Screen-A</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-md hover:bg-muted/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition"
            >
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <span className="hidden sm:inline text-sm w-[80px]">Dashboard</span>
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-xl mx-auto space-y-4 px-4 py-6 pt-24">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">
            Información de tu cuenta en NeuroScreen-A
          </p>
        </div>

        {/* Avatar + identity card */}
        <Card className="glass p-6">
          <div className="flex items-center gap-4">
            {/* Avatar circle */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {initials}
              </span>
            </div>

            {/* Email + role badge */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.email ?? "—"}</p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role ?? "usuario"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Detail fields */}
        <Card className="glass p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Detalles
          </h2>

          <div className="space-y-3">
            {/* Email row */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-secondary/50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  Correo electrónico
                </p>
                <p className="text-sm font-medium truncate">
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>

            {/* Role row */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-secondary/50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Rol</p>
                <p className="text-sm font-medium capitalize">
                  {user?.role ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="glass p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Acciones
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="glow-primary flex-1"
              onClick={() => setEditOpen(true)}
            >
              Editar información
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </Card>

        <UpdateUserDialog
          user={user as unknown as AppUser}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onUpdated={() => { refreshUser(); setEditOpen(false); }}
        />
      </div>
    </div>
  );
}
