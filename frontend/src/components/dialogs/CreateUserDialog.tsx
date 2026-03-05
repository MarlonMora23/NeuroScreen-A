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
import { Loader, Plus, Shield } from "lucide-react";
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
}

export default function CreateUserDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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

      onCreated();
      setOpen(false);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="glow-primary gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="glass border-border/50">
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
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              required
              value={newUser.first_name}
              onChange={(e) =>
                setNewUser({ ...newUser, first_name: e.target.value })
              }
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
            />
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
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              required
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />
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
