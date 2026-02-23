import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileUp,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useProcessing } from "@/contexts/processing-context";
import { patientService, Patient } from "@/services/patient-service";
import { eegService, type EEGRecord } from "@/services/eeg-service";

const UploadEEGTab = () => {
  const { user } = useAuth();
  const { addNotification, updateNotification } = useProcessing();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar pacientes
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getPatients();
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedPatient || !user) return;

    setUploading(true);
    setError(null);

    try {
      // Upload the EEG file
      const record = await eegService.uploadEEG(file, {
        patient_id: selectedPatient,
        uploader_id: user.id,
      });

      const patientName =
        patients.find((p) => String(p.id) === selectedPatient)?.first_name ||
        "Paciente";

      // Start monitoring the record
      startPolling(record, patientName);

      setUploaded(true);
      setTimeout(() => {
        setUploaded(false);
        setFile(null);
        setSelectedPatient("");
      }, 2500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar el archivo EEG";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const startPolling = async (record: EEGRecord, patientName: string) => {
    const recordKey = String(record.id);
    let retryCount = 0;

    // Add notification
    addNotification({
      id: recordKey,
      fileName: record.file_name,
      patientName,
      status: "pending",
    });

    // Callback for status changes
    const handleStatusChange = (updatedRecord: EEGRecord) => {
      // Handle failed status with retry information
      if (updatedRecord.status === "failed") {
        retryCount++;
      }

      updateNotification(recordKey, {
        status: updatedRecord.status,
        errorMsg: updatedRecord.error_msg,
        processingTimeMs: updatedRecord.processing_time_ms,
        retryAttempt: retryCount > 0 ? retryCount : undefined,
      });
    };

    try {
      const finalRecord = await eegService.pollEEGStatus(
        String(record.id),
        handleStatusChange,
        120, // 120 retries = 10 minutes with 5s intervals
        5000, // 5 second intervals
      );

      // Final update
      updateNotification(recordKey, {
        status: finalRecord.status,
        errorMsg: finalRecord.error_msg,
        processingTimeMs: finalRecord.processing_time_ms,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error durante el procesamiento";
      console.error("Polling error:", err);

      updateNotification(recordKey, {
        status: "failed",
        errorMsg: errorMessage,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {error && (
        <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            {loading ? (
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-muted-foreground">
                <Loader className="w-4 h-4 animate-spin" />
                Cargando pacientes...
              </div>
            ) : (
              <Select
                value={selectedPatient}
                onValueChange={(value) => setSelectedPatient(value)}
                disabled={uploading}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.identification_number} — {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
              accept=".edf,.csv,.json,.parquet"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            {uploaded ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <p className="text-success font-semibold">
                  ¡Archivo cargado exitosamente!
                </p>
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
                  Arrastra un archivo EEG o{" "}
                  <span className="text-primary font-medium">
                    haz clic para seleccionar
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: .edf, .csv, .json, .parquet
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!file || !selectedPatient || uploading || loading}
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
