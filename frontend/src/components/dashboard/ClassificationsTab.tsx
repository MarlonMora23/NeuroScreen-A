import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Classification {
  id: string;
  patientId: string;
  patientName: string;
  result: "alcoholismo" | "control";
  confidence: number;
  date: string;
  file: string;
}

const MOCK: Classification[] = [
  { id: "C-001", patientId: "P-001", patientName: "Juan Pérez García", result: "alcoholismo", confidence: 94.2, date: "2026-02-20", file: "eeg_001.edf" },
  { id: "C-002", patientId: "P-002", patientName: "María López Torres", result: "control", confidence: 97.8, date: "2026-02-19", file: "eeg_002.csv" },
  { id: "C-003", patientId: "P-003", patientName: "Carlos Mendoza Ruiz", result: "alcoholismo", confidence: 88.5, date: "2026-02-18", file: "eeg_003.mat" },
  { id: "C-004", patientId: "P-001", patientName: "Juan Pérez García", result: "alcoholismo", confidence: 91.0, date: "2026-02-15", file: "eeg_004.edf" },
];

const ClassificationsTab = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK.filter((c) =>
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.patientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{MOCK.length}</p>
          <p className="text-sm text-muted-foreground">Total Clasificaciones</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-destructive">{MOCK.filter((c) => c.result === "alcoholismo").length}</p>
          <p className="text-sm text-muted-foreground">Detectado Alcoholismo</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-success">{MOCK.filter((c) => c.result === "control").length}</p>
          <p className="text-sm text-muted-foreground">Control (Normal)</p>
        </div>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="hidden sm:table-cell">Confianza</TableHead>
              <TableHead className="hidden md:table-cell">Archivo</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} className="border-border/20">
                <TableCell className="font-mono text-primary text-sm">{c.id}</TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{c.patientName}</span>
                    <span className="block text-xs text-muted-foreground">{c.patientId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {c.result === "alcoholismo" ? (
                    <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Alcoholismo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Control
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.result === "alcoholismo" ? "bg-destructive" : "bg-success"}`}
                        style={{ width: `${c.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono">{c.confidence}%</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">{c.file}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c.date}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron clasificaciones
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default ClassificationsTab;
