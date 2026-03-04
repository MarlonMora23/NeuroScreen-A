import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { httpClient } from "@/services/http-client";
import { API_ENDPOINTS } from "@/config/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setToken(null);

    try {
      const resp = await httpClient.post<{ message?: string; token?: string }>(
        API_ENDPOINTS.AUTH_FORGOT,
        { email }
      );
      setMessage(resp.message || "Si el correo existe, se ha enviado un enlace de recuperación.");
      if (resp.token) setToken(resp.token);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Error al solicitar recuperación";
      setMessage(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Recuperar contraseña</h2>

        {message && <Alert className="mb-4">{message}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-input"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 text-base font-semibold glow-primary"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
              Volver
            </Button>
          </div>
        </form>

        {/* token (solo dev): único recuadro, limitado y con botón copiar */}
        {token && import.meta.env.MODE !== "production" && (
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">Token (solo desarrollo)</div>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(token)}>
                Copiar
              </Button>
            </div>

            <div className="bg-secondary p-3 rounded border border-neutral-800 max-w-full max-h-36 overflow-auto">
              <pre className="m-0 text-sm leading-5 break-all whitespace-pre-wrap">{token}</pre>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Usa este token en <code>/reset-password</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;