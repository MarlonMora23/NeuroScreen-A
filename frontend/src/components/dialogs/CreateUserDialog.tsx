import { useState } from "react";
import { userService, CreateUserRequest } from "@/services/user-service";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader, Plus, Shield, Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { HttpError } from "@/services/http-client";

interface Props {
  onCreated: () => void;
  onCreateSuccess?: (firstName: string, lastName: string) => void;
  onCreateError?: (error: string) => void;
}

export default function CreateUserDialog({
  onCreated,
  onCreateSuccess,
  onCreateError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newUser.password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setPasswordError("");
    setIsCreating(true);

    try {
      await userService.createUser(newUser);

      setNewUser({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "",
      });

      setConfirmPassword("");
      setPasswordError("");

      onCreated();
      onCreateSuccess?.(newUser.first_name, newUser.last_name);
      setOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof HttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unexpected error";
      setError(errorMessage);
      onCreateError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setError(null);
          setPasswordError("");
          setConfirmPassword("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="glow-primary gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Nuevo Usuario</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-background/95 border-border/50 mx-auto w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Crear Usuario
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="bg-destructive/10 border-destructive/30 text-destructive mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                required
                value={newUser.first_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, first_name: e.target.value })
                }
                autoComplete="given-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                required
                value={newUser.last_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, last_name: e.target.value })
                }
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              required
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="space-y-2">
            <Label>Contraseña</Label>
            <div className="relative">
              <Input
                required
                type={showPassword ? "text" : "password"}
                value={newUser.password}
                onChange={(e) => {
                  setNewUser({ ...newUser, password: e.target.value });
                  setPasswordError("");
                }}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Confirmar contraseña</Label>
            <div className="relative">
              <Input
                required
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                className={`pr-10 ${
                  passwordError
                    ? "border-destructive focus:border-destructive"
                    : ""
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select
              value={newUser.role}
              onValueChange={(v) => setNewUser({ ...newUser, role: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full glow-primary"
            disabled={isCreating}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Creando...
              </span>
            ) : (
              "Crear Usuario"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
