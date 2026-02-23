import { Brain, Activity } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold">
              Neuro<span className="text-primary">Screen-A</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Marlon Mora y Martín Correa.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="w-3 h-3 text-primary animate-pulse-glow" />
            Sistema activo
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
