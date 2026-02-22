import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, User, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  createdAt: string;
}

const MOCK_PATIENTS: Patient[] = [
  { id: "P-001", name: "Juan Pérez García", age: 45, sex: "Masculino", createdAt: "2026-02-20" },
  { id: "P-002", name: "María López Torres", age: 38, sex: "Femenino", createdAt: "2026-02-18" },
  { id: "P-003", name: "Carlos Mendoza Ruiz", age: 52, sex: "Masculino", createdAt: "2026-02-15" },
];

const PatientsTab = () => {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", age: "", sex: "" });

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      id: `P-${String(patients.length + 1).padStart(3, "0")}`,
      name: newPatient.name,
      age: parseInt(newPatient.age),
      sex: newPatient.sex,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPatients([patient, ...patients]);
    setNewPatient({ name: "", age: "", sex: "" });
    setOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="glow-primary gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Registrar Nuevo Paciente
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  required
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="Nombre del paciente"
                  className="bg-secondary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Edad</Label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={120}
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    placeholder="Años"
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select
                    value={newPatient.sex}
                    onValueChange={(v) => setNewPatient({ ...newPatient, sex: v })}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full glow-primary">
                Registrar Paciente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Edad</TableHead>
              <TableHead className="hidden sm:table-cell">Sexo</TableHead>
              <TableHead className="hidden md:table-cell">Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-border/20">
                <TableCell className="font-mono text-primary text-sm">{p.id}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{p.age}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{p.sex}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{p.createdAt}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default PatientsTab;
