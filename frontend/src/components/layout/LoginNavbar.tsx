import { Brain, Activity, Sun, Moon, Zap } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useNavigate } from "react-router-dom";

const LoginNavbar = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="relative">
            <Brain className="w-7 h-7 text-primary" />
            <Activity className="w-3 h-3 text-landingaccent absolute -top-0.5 -right-1 animate-pulse-glow" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Neuro<span className="text-primary">Screen-A</span>
          </span>
        </div>
        <div className="flex items-right gap-3">
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
            className="invisible flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Comenzar</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LoginNavbar;
