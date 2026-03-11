import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Shield,
  ShieldCheck,
  AlertCircle,
  Loader,
  Eye,
  Trash2,
  Pencil,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  userService,
  AppUser,
  CreateUserRequest,
} from "@/services/user-service";
import { useAuth } from "@/contexts/auth-context";
import { extractError } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CreateUserDialog from "../dialogs/CreateUserDialog";
import UpdateUserDialog from "../dialogs/UpdateUserDialog";
import ActionToast, { ActionToastItem } from "@/components/notifications/ActionToast";

const UsersTab = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ActionToastItem[]>([]);
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
  });

  const addToast = (toast: Omit<ActionToastItem, "id">) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar usuarios";
      setError(errorMessage);
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.first_name.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toString().includes(search),
  );

  const roleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-primary/20 text-primary border-primary/30",
      user: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    };
    return (
      <Badge
        variant="outline"
        className={
          variants[role] || "bg-secondary/20 text-secondary border-secondary/30"
        }
      >
        {role === "admin" && <ShieldCheck className="w-3 h-3 mr-1" />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <ActionToast items={toasts} onDismissItem={removeToast} />
      {error && (
        <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50"
            disabled={loading}
          />
        </div>
        <CreateUserDialog 
          onCreated={loadUsers}
          onCreateSuccess={(firstName, lastName) => 
            addToast({
              type: "success",
              title: "Usuario creado",
              message: `${firstName} ${lastName} ha sido creado correctamente.`,
            })
          }
          onCreateError={(error) => 
            addToast({
              type: "error",
              title: "Error al crear usuario",
              message: error,
            })
          }
        />
      </div>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-background/95 border-border/50">
          <DialogHeader>
            <DialogTitle>Detalles del usuario</DialogTitle>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-2 pt-2">
              <div>
                <strong>ID:</strong> {selectedUser.id}
              </div>
              <div>
                <strong>Nombre:</strong> {selectedUser.first_name}{" "}
                {selectedUser.last_name}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>Rol:</strong> {selectedUser.role}
              </div>
              <div>
                <strong>Creado:</strong> {selectedUser.created_at || "-"}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">Cargando...</div>
          )}
        </DialogContent>
      </Dialog>

      <div className="glass rounded-xl overflow-hidden">
        {loading && user?.role === "admin" ? ( 
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead>#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-left">Rol</TableHead>
                <TableHead className="hidden md:table-cell">Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              
              {filtered.map((u, index) => (
                <TableRow key={u.id} className="border-border/20">
                  <TableCell className="font-mono text-primary text-sm">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {u.first_name} {u.last_name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {u.email}
                  </TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const data = await userService.getUser(
                              String(u.id),
                            );
                            setSelectedUser(data);
                            setDetailsOpen(true);
                          } catch (err) {
                            const errorMessage = extractError(err);
                            setError(errorMessage);
                            addToast({
                              type: "error",
                              title: "Error al cargar detalles",
                              message: errorMessage,
                            });
                          }
                        }}
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                        onClick={() => {
                          setSelectedUser(u);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Invalidar sesión"
                        onClick={async () => {
                          try {
                            await userService.invalidateSession(String(u.id));
                            addToast({
                              type: "success",
                              title: "Sesión invalidada",
                              message: `La sesión de ${u.first_name} ${u.last_name} ha sido invalidada correctamente.`,
                            });
                          } catch (err) {
                            setError(extractError(err));
                            addToast({
                              type: "error",
                              title: "Error al invalidar sesión",
                              message: extractError(err),
                            });
                          }
                        }}
                      >
                        <LogOut className="w-4 h-4 text-orange-500" />
                      </Button>

                      
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Eliminar">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background/95 border-border/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirmar eliminación
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="mt-4 text-right space-x-2">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await userService.deleteUser(String(u.id));
                                    addToast({
                                      type: "success",
                                      title: "Usuario eliminado",
                                      message: `${u.first_name} ${u.last_name} ha sido eliminado correctamente.`,
                                    });
                                    await loadUsers();
                                  } catch (err) {
                                    setError(extractError(err));
                                    addToast({
                                      type: "error",
                                      title: "Error al eliminar usuario",
                                      message: extractError(err),
                                    });
                                  }
                                }}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
              
            </TableBody>
          </Table>
        )}
      </div>
      <UpdateUserDialog
        user={selectedUser}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadUsers}
        onUpdateSuccess={(firstName, lastName) => 
          addToast({
            type: "success",
            title: "Usuario actualizado",
            message: `${firstName} ${lastName} ha sido actualizado correctamente.`,
          })
        }
        onUpdateError={(error) => 
          addToast({
            type: "error",
            title: "Error al actualizar usuario",
            message: error,
          })
        }
      />
    </motion.div>
  );
};

export default UsersTab;
