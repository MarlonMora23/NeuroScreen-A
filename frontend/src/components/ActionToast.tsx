import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ActionToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  onDismiss?: () => void;
}

interface ActionToastProps {
  items: ActionToastItem[];
  onDismissItem?: (id: string) => void;
  autoCloseDuration?: number; // en ms
}

const ActionToast: React.FC<ActionToastProps> = ({
  items,
  onDismissItem,
  autoCloseDuration = 15000,
}) => {
  const toastRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  React.useEffect(() => {
    items.forEach((item) => {
      // Clear any existing timeout for this item
      const existingTimeout = toastRefs.current.get(item.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout for auto-dismiss
      const timeout = setTimeout(() => {
        onDismissItem?.(item.id);
      }, autoCloseDuration);

      toastRefs.current.set(item.id, timeout);
    });

    return () => {
      // Cleanup timeouts
      toastRefs.current.forEach((timeout) => clearTimeout(timeout));
      toastRefs.current.clear();
    };
  }, [items, onDismissItem, autoCloseDuration]);

  if (items.length === 0) {
    return null;
  }

  const getIcon = (type: ActionToastItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 flex-shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case "info":
        return <Info className="w-5 h-5 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getStyles = (type: ActionToastItem["type"]) => {
    switch (type) {
      case "success":
        return "bg-success/30 border-success/30 text-success";
      case "error":
        return "bg-destructive/30 border-destructive/30 text-destructive";
      case "warning":
        return "bg-yellow-500/30 border-yellow-500/30 text-yellow-600";
      case "info":
        return "bg-blue-500/30 border-blue-500/30 text-blue-600";
      default:
        return "bg-primary/30 border-primary/30 text-primary";
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            layout
            className={`mb-3 rounded-lg border p-4 backdrop-blur-3xl flex gap-3 items-start ${getStyles(item.type)}`}
          >
            {getIcon(item.type)}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.title}</p>
              {item.message && (
                <p className="text-xs opacity-80 mt-1">{item.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismissItem?.(item.id)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ActionToast;
