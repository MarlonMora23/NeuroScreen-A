import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, User, Loader, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  patientService,
  Patient,
  CreatePatientRequest,
} from "@/services/patient-service";

const PatientsTab = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState({
    has_eeg_records: undefined as boolean | undefined,
    has_pending_eeg: undefined as boolean | undefined,
  });
  const [newPatient, setNewPatient] = useState<CreatePatientRequest>({
    identification_number: "",
    first_name: "",
    last_name: "",
    birth_date: "",
  });

  // Cargar pacientes cuando cambian los filtros o búsqueda
  useEffect(() => {
    loadPatients();
  }, [search, filters]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar filtros para enviar al backend
      const backendFilters: any = {};

      // Si hay búsqueda, asumir que es por nombre o apellido
      if (search) {
        backendFilters.first_name = search;
      }

      // Agregar filtros de EEG
      if (filters.has_eeg_records !== undefined) {
        backendFilters.has_eeg_records = filters.has_eeg_records;
      }
      if (filters.has_pending_eeg !== undefined) {
        backendFilters.has_pending_eeg = filters.has_pending_eeg;
      }

      const data = await patientService.getPatients(backendFilters);
      setPatients(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar pacientes";
      setError(errorMessage);
      console.error("Error loading patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.first_name.toLowerCase().includes(search.toLowerCase()) ||
      p.last_name.toLowerCase().includes(search.toLowerCase()) ||
      p.identification_number.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await patientService.createPatient(newPatient);
      await loadPatients();
      setNewPatient({
        identification_number: "",
        first_name: "",
        last_name: "",
        birth_date: "",
      });
      setOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear paciente";
      setError(errorMessage);
      console.error("Error creating patient:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {error && (
        <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col justify-between sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-border/40 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                EEG
              </Label>
              <select
                value={
                  filters.has_eeg_records === undefined
                    ? ""
                    : String(filters.has_eeg_records)
                }
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    has_eeg_records:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                  })
                }
                className="px-3 py-2 bg-secondary/50 border border-border/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                Pendiente
              </Label>
              <select
                value={
                  filters.has_pending_eeg === undefined
                    ? ""
                    : String(filters.has_pending_eeg)
                }
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    has_pending_eeg:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                  })
                }
                className="px-3 py-2 bg-secondary/50 border border-border/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="h-8 w-px bg-border/40 hidden sm:block" />

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  className="glow-primary gap-2 shrink-0"
                  disabled={loading || isCreating}
                >
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
                    <Label>Cédula/Identificación</Label>
                    <Input
                      required
                      value={newPatient.identification_number}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          identification_number: e.target.value,
                        })
                      }
                      placeholder="Número de identificación"
                      className="bg-secondary/50"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        required
                        value={newPatient.first_name}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            first_name: e.target.value,
                          })
                        }
                        placeholder="Nombre"
                        className="bg-secondary/50"
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellido</Label>
                      <Input
                        required
                        value={newPatient.last_name}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            last_name: e.target.value,
                          })
                        }
                        placeholder="Apellido"
                        className="bg-secondary/50"
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input
                      type="date"
                      value={newPatient.birth_date || ""}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          birth_date: e.target.value,
                        })
                      }
                      className="bg-secondary/50"
                      disabled={isCreating}
                    />
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
                      "Registrar Paciente"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Apellido</TableHead>
                <TableHead className="hidden md:table-cell">
                  Nacimiento
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="border-border/20">
                  <TableCell className="font-mono text-primary text-sm">
                    {p.id}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {p.identification_number}
                  </TableCell>
                  <TableCell className="font-medium">{p.first_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.last_name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {p.birth_date
                      ? new Date(p.birth_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron pacientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </motion.div>
  );
};

export default PatientsTab;
