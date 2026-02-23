import React, { createContext, useContext, useState, useCallback } from "react";
import { ProcessingNotificationItem } from "@/components/ProcessingNotification";

interface ProcessingContextType {
  notifications: ProcessingNotificationItem[];
  addNotification: (item: ProcessingNotificationItem) => void;
  updateNotification: (id: string, updates: Partial<ProcessingNotificationItem>) => void;
  dismissNotification: (id: string) => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<ProcessingNotificationItem[]>([]);

  const addNotification = useCallback((item: ProcessingNotificationItem) => {
    setNotifications((prev) => [...prev, item]);
  }, []);

  const updateNotification = useCallback(
    (id: string, updates: Partial<ProcessingNotificationItem>) => {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      );
    },
    [],
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <ProcessingContext.Provider
      value={{
        notifications,
        addNotification,
        updateNotification,
        dismissNotification,
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error("useProcessing must be used within ProcessingProvider");
  }
  return context;
};
