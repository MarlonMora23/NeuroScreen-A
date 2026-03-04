import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { httpClient } from "@/services/http-client";
import { API_ENDPOINTS } from "@/config/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const resp = await httpClient.post<{ message?: string }>(API_ENDPOINTS.AUTH_RESET, { token, password });
      setMessage(resp.message || "Contraseña actualizada correctamente.");
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Error al restablecer contraseña";
      setMessage(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Restablecer contraseña</h2>

        {message && (
          <Alert className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token">Token</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !token || !password} className="flex-1">
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Volver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
