import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Activity, AlertTriangle, CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { eegService, PredictionResult } from "@/services/eeg-service";

const ClassificationsTab = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar predicciones
  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eegService.getAllPredictions();
      setPredictions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar predicciones";
      setError(errorMessage);
      console.error("Error loading predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = predictions.filter((c) =>
    String(c.id).toLowerCase().includes(search.toLowerCase()) ||
    c.eeg_record_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalAlcoholism = predictions.filter((c) => c.result === "alcoholic").length;
  const totalControl = predictions.filter((c) => c.result === "non_alcoholic").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {error && (
        <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{predictions.length}</p>
          <p className="text-sm text-muted-foreground">Total Clasificaciones</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-destructive">{totalAlcoholism}</p>
          <p className="text-sm text-muted-foreground">Detectado Alcohólico</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-success">{totalControl}</p>
          <p className="text-sm text-muted-foreground">No Alcohólico</p>
        </div>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar predicción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/50"
          disabled={loading}
        />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead>ID Predicción</TableHead>
                <TableHead>Registro EEG</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="hidden sm:table-cell">Confianza</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border/20">
                  <TableCell className="font-mono text-primary text-sm">{c.id}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{c.eeg_record_id}</TableCell>
                  <TableCell>
                    {c.result === "alcoholic" ? (
                      <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Alcohólico
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        No Alcohólico
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.result === "alcoholic" ? "bg-destructive" : "bg-success"}`}
                          style={{ width: `${parseFloat(c.confidence.toString()) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono">{(parseFloat(c.confidence.toString()) * 100).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron clasificaciones
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

export default ClassificationsTab;
