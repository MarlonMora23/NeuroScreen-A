import { useState, useEffect } from "react";
import { Loader, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { patientService, Patient, UpdatePatientRequest } from "@/services/patient-service";

interface Props {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function UpdatePatientDialog({
  patient,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<UpdatePatientRequest>({
    first_name: "",
    last_name: "",
    birth_date: "",
  });

  useEffect(() => {
    if (patient) {
      setForm({
        first_name: patient.first_name,
        last_name: patient.last_name,
        birth_date: patient.birth_date || "",
      });
    }
  }, [patient]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient) return;

    setLoading(true);

    try {
      await patientService.updatePatient(patient.id, form);
      await onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Editar Paciente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="bg-secondary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="bg-secondary/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha de nacimiento</Label>
            <Input
              type="date"
              value={form.birth_date}
              onChange={(e) =>
                setForm({ ...form, birth_date: e.target.value })
              }
              className="bg-secondary/50"
            />
          </div>

          <Button type="submit" className="w-full glow-primary">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Actualizando...
              </span>
            ) : (
              "Actualizar Paciente"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}