import { useEffect, useState } from "react";
import { userService, AppUser } from "@/services/user-service";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Eye, EyeOff, Loader, Pencil } from "lucide-react";
import { translateError } from "@/utils/error-translations";

interface Props {
  user: AppUser | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onUpdateSuccess?: (firstName: string, lastName: string) => void;
  onUpdateError?: (error: string) => void;
}

export default function UpdateUserDialog({
  user,
  open,
  onClose,
  onUpdated,
  onUpdateSuccess,
  onUpdateError,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password: "",
        confirmPassword: "",
      });
      setPasswordError("");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate passwords match if user typed something
    if (form.password && form.password !== form.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setPasswordError("");
    setIsUpdating(true);

    try {
      const { confirmPassword, ...payload } = form;
      // Only send password if user actually filled it in
      if (!payload.password) delete (payload as Partial<typeof payload>).password;

      await userService.updateUser(String(user.id), payload);
      onUpdated();
      onUpdateSuccess?.(form.first_name, form.last_name);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar usuario";
      const translatedMessage = translateError(errorMessage);
      onUpdateError?.(translatedMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 border-border/50 mx-auto w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Usuario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                autoComplete="given-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Dejar vacío para no cambiar"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setPasswordError("");
                }}
                className="bg-secondary/50 border-border/50 focus:border-primary pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Confirmar contraseña</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                value={form.confirmPassword}
                onChange={(e) => {
                  setForm({ ...form, confirmPassword: e.target.value });
                  setPasswordError("");
                }}
                className={`bg-secondary/50 border-border/50 focus:border-primary pr-10 ${
                  passwordError ? "border-destructive focus:border-destructive" : ""
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full glow-primary"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Actualizando...
              </span>
            ) : (
              "Actualizar Usuario"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}