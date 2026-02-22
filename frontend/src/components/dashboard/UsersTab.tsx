import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const MOCK_USERS: AppUser[] = [
  { id: "U-001", name: "Dr. Admin", email: "admin@neuroscreen.com", role: "admin", createdAt: "2026-01-01" },
  { id: "U-002", name: "Dra. Ana Martínez", email: "ana@neuroscreen.com", role: "investigador", createdAt: "2026-01-15" },
  { id: "U-003", name: "Tec. Roberto Sánchez", email: "roberto@neuroscreen.com", role: "tecnico", createdAt: "2026-02-01" },
];

const UsersTab = () => {
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "" });

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const user: AppUser = {
      id: `U-${String(users.length + 1).padStart(3, "0")}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers([user, ...users]);
    setNewUser({ name: "", email: "", password: "", role: "" });
    setOpen(false);
  };

  const roleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-primary/20 text-primary border-primary/30",
      investigador: "bg-accent/20 text-accent border-accent/30",
      tecnico: "bg-success/20 text-success border-success/30",
    };
    return (
      <Badge variant="outline" className={variants[role] || ""}>
        {role === "admin" && <ShieldCheck className="w-3 h-3 mr-1" />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
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
                Crear Nuevo Usuario
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nombre del usuario"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="investigador">Investigador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full glow-primary">
                Crear Usuario
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className="border-border/20">
                <TableCell className="font-mono text-primary text-sm">{u.id}</TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{u.email}</TableCell>
                <TableCell>{roleBadge(u.role)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{u.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default UsersTab;
