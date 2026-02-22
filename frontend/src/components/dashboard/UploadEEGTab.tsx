import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileUp, Brain, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PATIENTS = [
  { id: "P-001", name: "Juan Pérez García" },
  { id: "P-002", name: "María López Torres" },
  { id: "P-003", name: "Carlos Mendoza Ruiz" },
];

const UploadEEGTab = () => {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedPatient) return;
    setUploading(true);
    // TODO: connect to external backend
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setTimeout(() => {
        setUploaded(false);
        setFile(null);
        setSelectedPatient("");
      }, 2500);
    }, 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <Brain className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Cargar Registro EEG</h2>
          <p className="text-sm text-muted-foreground">
            Sube un archivo EEG para realizar una nueva clasificación con la CNN
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Paciente</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {PATIENTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".edf,.csv,.mat,.set"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            {uploaded ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <p className="text-success font-semibold">¡Archivo cargado exitosamente!</p>
              </div>
            ) : file ? (
              <div className="space-y-2">
                <FileUp className="w-12 h-12 text-primary mx-auto" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto group-hover:text-primary transition-colors" />
                <p className="text-muted-foreground">
                  Arrastra un archivo EEG o <span className="text-primary font-medium">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: .edf, .csv, .mat, .set
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!file || !selectedPatient || uploading}
            className="w-full h-12 text-base font-semibold glow-primary"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Clasificar con CNN
              </span>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default UploadEEGTab;
