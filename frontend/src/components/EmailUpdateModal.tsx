import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/user-service";
import { useAuth } from "@/contexts/auth-context";

interface Props {
  userId: string;
  initialEmail: string;
  onClose: () => void;
}

const EmailUpdateModal = ({ userId, initialEmail, onClose }: Props) => {
  const { logout } = useAuth();
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await userService.updateUser(userId, { email, current_password: password });
      setMessage("Email actualizado correctamente. Se cerrará la sesión por seguridad.");
      setTimeout(() => {
        logout();
      }, 1200);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Error al actualizar";
      setMessage(m);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="fixed inset-0 p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} style={{ zIndex: 9999 }} />
      <div
        className="bg-background p-6 rounded-lg w-full max-w-md glass shadow-xl"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold mb-2">Modificar correo electrónico</h3>
          <button aria-label="Cerrar" onClick={onClose} className="ml-4 text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {message && <div className="mb-3 text-sm text-muted-foreground">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Nuevo correo</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña actual</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={onClose} type="button">Cerrar</Button>
            <Button type="submit" disabled={loading || !email || !password}>
              {loading ? "Guardando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
};

export default EmailUpdateModal;
