import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Clock, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProcessingNotificationItem {
  id: string;
  fileName: string;
  patientName: string;
  status: "pending" | "processing" | "processed" | "failed";
  errorMsg?: string;
  processingTimeMs?: number;
  retryAttempt?: number;
  onDismiss?: () => void;
  onViewResult?: () => void;
}

interface ProcessingNotificationProps {
  items: ProcessingNotificationItem[];
  onDismissItem?: (id: string) => void;
  onViewResult?: (id: string) => void;
}

const ProcessingNotification: React.FC<ProcessingNotificationProps> = ({
  items,
  onDismissItem,
  onViewResult,
}) => {
  if (items.length === 0) {
    return null;
  }

  const getStatusIcon = (
    status: ProcessingNotificationItem["status"],
    retryAttempt?: number,
  ) => {
    switch (status) {
      case "processed":
        return (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 animate-pulse-glow" />
        );
      case "failed":
        return (
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
        );
      case "processing":
        return (
          <div className="w-5 h-5 flex-shrink-0">
            <div className="w-full h-full border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        );
      default:
        return (
          <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        );
    }
  };

  const getStatusText = (
    status: ProcessingNotificationItem["status"],
    retryAttempt?: number,
  ) => {
    switch (status) {
      case "pending":
        return "En cola de procesamiento";
      case "processing":
        return "Procesando archivo EEG con modelo de inferencia";
      case "processed":
        return "Análisis completado exitosamente";
      case "failed":
        return retryAttempt && retryAttempt < 3
          ? `Error - Reintentando (${retryAttempt}/3)`
          : "Error - Se alcanzó el límite de reintentos";
      default:
        return status;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 w-full max-w-md">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            layout
            className={`mb-3 rounded-lg border p-4 backdrop-blur-3xl ${
              item.status === "processed"
                ? "bg-success/30 border-success/30 text-success"
                : item.status === "failed"
                  ? "bg-destructive/30 border-destructive/30 text-destructive"
                  : "bg-primary/30 border-primary/30 text-primary"
            }`}
          >
            <div className="flex gap-3">
              {getStatusIcon(item.status, item.retryAttempt)}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {item.status === "processed"
                    ? "Predicción completada"
                    : item.status === "failed"
                      ? "Error en la predicción"
                      : "Procesando predicción"}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {item.fileName} • {item.patientName}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {getStatusText(item.status, item.retryAttempt)}
                </p>
                {item.errorMsg && item.status === "failed" && (
                  <p className="text-xs opacity-60 mt-1 break-words">
                    Error: {item.errorMsg}
                  </p>
                )}
                {item.processingTimeMs && item.status === "processed" && (
                  <p className="text-xs opacity-60 mt-1">
                    Tiempo: {(item.processingTimeMs / 1000).toFixed(2)}s
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {item.status === "processed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewResult?.(item.id)}
                    className="text-xs h-7 px-2 hover:bg-success/70 hover:text-success-foreground"
                  >
                    Ver
                  </Button>
                )}
                <button
                  onClick={() => onDismissItem?.(item.id)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ProcessingNotification;
// export type { ProcessingNotificationItem };
