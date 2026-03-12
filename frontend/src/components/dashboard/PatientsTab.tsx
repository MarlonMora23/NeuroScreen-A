import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader, AlertCircle, Eye, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useAuth } from "@/contexts/auth-context";
import { extractError } from "@/lib/utils";
import UpdatePatientDialog from "../dialogs/UpdatePatientDialog"; // ensure proper default import
import CreatePatientDialog from "@/components/dialogs/CreatePatientDialog";
import ActionToast, {
  ActionToastItem,
} from "@/components/notifications/ActionToast";

const PatientsTab = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState(""); // Búsqueda que se envía al backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ActionToastItem[]>([]);

  const addToast = (toast: Omit<ActionToastItem, "id">) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cargar pacientes solo cuando cambian los filtros o se hace búsqueda
  useEffect(() => {
    loadPatients();
  }, [filters]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendFilters: any = {};

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
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (!search) return true;

    const term = search.toLowerCase();

    return (
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.identification_number.toLowerCase().includes(term)
    );
  });

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
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between w-full gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 w-full"
              disabled={loading}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <div className="w-full sm:w-auto">
              <CreatePatientDialog
                onCreated={loadPatients}
                onCreateSuccess={(firstName, lastName) =>
                  addToast({
                    type: "success",
                    title: "Paciente creado",
                    message: `${firstName} ${lastName} ha sido registrado correctamente.`,
                  })
                }
                onCreateError={(error) =>
                  addToast({
                    type: "error",
                    title: "Error al crear paciente",
                    message: error,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-background/95 border-border/50 mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>Detalles del paciente</DialogTitle>
          </DialogHeader>
          {selectedPatient ? (
            <div className="space-y-2 pt-2 text-sm sm:text-base">
              <div>
                <strong>ID:</strong> {selectedPatient.id}
              </div>
              <div>
                <strong>Identificación:</strong>{" "}
                {selectedPatient.identification_number}
              </div>
              <div>
                <strong>Nombre:</strong> {selectedPatient.first_name}{" "}
                {selectedPatient.last_name}
              </div>
              <div>
                <strong>Fecha de nacimiento:</strong>{" "}
                {selectedPatient.birth_date || "-"}
              </div>
              {user?.role === "admin" && (
                <div className="break-all">
                  <strong>Creado por:</strong> {selectedPatient.created_by}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">Cargando...</div>
          )}
        </DialogContent>
      </Dialog>
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
                <TableHead>#</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Apellido</TableHead>
                <TableHead className="hidden md:table-cell">
                  Nacimiento
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p, index) => (
                <TableRow key={p.id} className="border-border/20">
                  <TableCell className="font-mono text-primary text-sm">
                    {index + 1}
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
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const data = await patientService.getPatient(
                              String(p.id),
                            );
                            setSelectedPatient(data);
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
                          setSelectedPatient(p);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>

                      {(user?.role === "admin" ||
                        user?.id === p.created_by) && (
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
                                    await patientService.deletePatient(
                                      String(p.id),
                                    );
                                    addToast({
                                      type: "success",
                                      title: "Paciente eliminado",
                                      message: `${p.first_name} ${p.last_name} ha sido eliminado correctamente.`,
                                    });
                                    await loadPatients();
                                  } catch (err) {
                                    const errorMsg = extractError(err);
                                    setError(errorMsg);
                                    addToast({
                                      type: "error",
                                      title: "Error al eliminar paciente",
                                      message: errorMsg,
                                    });
                                  }
                                }}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
                    No se encontraron pacientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <UpdatePatientDialog
        patient={selectedPatient}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadPatients}
        onUpdateSuccess={(firstName, lastName) =>
          addToast({
            type: "success",
            title: "Paciente actualizado",
            message: `${firstName} ${lastName} ha sido actualizado correctamente.`,
          })
        }
        onUpdateError={(error) =>
          addToast({
            type: "error",
            title: "Error al actualizar paciente",
            message: error,
          })
        }
      />
    </motion.div>
  );
};

export default PatientsTab;
