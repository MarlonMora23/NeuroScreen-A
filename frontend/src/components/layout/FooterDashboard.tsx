import { Info } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-4">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground text-center">
            Este sistema es una herramienta de apoyo basada en investigación
            académica y no sustituye el diagnóstico médico profesional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground text-center">
            @ {new Date().getFullYear()} Marlon Mora y Martín Correa.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
