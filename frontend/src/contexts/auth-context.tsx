/**
 * Auth Context
 * Contexto global para manejar el estado de autenticación
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService, CurrentUser } from "@/services/auth-service";

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar si hay un token guardado y obtener el usuario actual
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        authService.clearToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<string>;

      window.sessionStorage.setItem(
        "sessionExpired",
        "Tu sesión expiró por seguridad.",
      );

      authService.clearToken();
      setUser(null);

      window.sessionStorage.setItem(
        "sessionExpired",
        "Tu sesión expiró por seguridad.",
      );

      // Redirección directa
      window.location.href = "/login";
    };

    window.addEventListener("unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      if (response.user) {
        setUser(response.user);
      } else {
        // Si no viene el usuario en la respuesta, intenta obtenerlo
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Error during logout:", err);
      // Aún así limpiar el estado local
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
};
