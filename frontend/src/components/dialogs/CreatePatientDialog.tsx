import { useState } from "react";
import { Plus, Loader, User } from "lucide-react";

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
  patientService,
  CreatePatientRequest,
} from "@/services/patient-service";

interface Props {
  onCreated: () => void;
  onCreateSuccess?: (firstName: string, lastName: string) => void;
  onCreateError?: (error: string) => void;
}

export default function CreatePatientDialog({
  onCreated,
  onCreateSuccess,
  onCreateError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState<CreatePatientRequest>({
    identification_number: "",
    first_name: "",
    last_name: "",
    birth_date: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsCreating(true);

    try {
      await patientService.createPatient(form);

      const firstName = form.first_name;
      const lastName = form.last_name;

      setForm({
        identification_number: "",
        first_name: "",
        last_name: "",
        birth_date: "",
      });

      onCreated();
      onCreateSuccess?.(firstName, lastName);
      setOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al crear paciente";
      onCreateError?.(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glow-primary gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline-block">Nuevo Paciente</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-background/95 border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Registrar Nuevo Paciente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Cédula / Identificación</Label>
            <Input
              required
              value={form.identification_number}
              onChange={(e) =>
                setForm({
                  ...form,
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
                value={form.first_name}
                onChange={(e) =>
                  setForm({
                    ...form,
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
                value={form.last_name}
                onChange={(e) =>
                  setForm({
                    ...form,
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
            <Label>Fecha de nacimiento</Label>
            <Input
              type="date"
              value={form.birth_date || ""}
              onChange={(e) =>
                setForm({
                  ...form,
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
  );
}
