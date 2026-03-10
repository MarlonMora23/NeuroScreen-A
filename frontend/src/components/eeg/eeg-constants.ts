import { PredictionResult } from "@/services/eeg-service";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ALL_CHANNELS = [
  "F1",
  "F2",
  "F6",
  "FT7",
  "FT8",
  "FC3",
  "FC4",
  "FCZ",
  "O1",
  "O2",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "CP2",
  "CP3",
  "CP5",
  "CP6",
  "CPZ",
  "AF7",
  "AF8",
  "P1",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "PO1",
  "PO7",
  "PO8",
  "T7",
  "T8",
  "TP7",
];

export const CHANNEL_GROUPS: Record<string, string[]> = {
  Frontal: ["F1", "F2", "F6", "FT7", "FT8", "FC3", "FC4", "FCZ", "AF7", "AF8"],
  Central: ["C1", "C2", "C3", "C4", "C5", "CP2", "CP3", "CP5", "CP6", "CPZ"],
  Parietal: ["P1", "P4", "P5", "P6", "P7", "P8", "PO1", "PO7", "PO8"],
  Occipital: ["O1", "O2"],
  Temporal: ["T7", "T8", "TP7"],
};

// Posiciones 2D estándar 10-20 para el topomap
export const EEG_POSITIONS: Record<string, [number, number]> = {
  F1: [-0.22, 0.65],
  F2: [0.22, 0.65],
  F6: [0.55, 0.58],
  FT7: [-0.72, 0.4],
  FT8: [0.72, 0.4],
  FC3: [-0.38, 0.52],
  FC4: [0.38, 0.52],
  FCZ: [0.0, 0.55],
  O1: [-0.28, -0.9],
  O2: [0.28, -0.9],
  C1: [-0.2, 0.0],
  C2: [0.2, 0.0],
  C3: [-0.58, 0.0],
  C4: [0.58, 0.0],
  C5: [-0.78, 0.0],
  CP2: [0.22, -0.28],
  CP3: [-0.38, -0.28],
  CP5: [-0.68, -0.28],
  CP6: [0.68, -0.28],
  CPZ: [0.0, -0.25],
  AF7: [-0.62, 0.78],
  AF8: [0.62, 0.78],
  P1: [-0.22, -0.6],
  P4: [0.38, -0.55],
  P5: [-0.6, -0.55],
  P6: [0.6, -0.55],
  P7: [-0.72, -0.45],
  P8: [0.72, -0.45],
  PO1: [-0.22, -0.78],
  PO7: [-0.62, -0.72],
  PO8: [0.62, -0.72],
  T7: [-0.92, 0.0],
  T8: [0.92, 0.0],
  TP7: [-0.82, -0.28],
};

export const ZOOM_LEVELS = [0.25, 0.5, 1.0, 2.0, 4.0];
export const ZOOM_LABELS = ["0.25s", "0.5s", "1s", "2s", "4s"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EegVisualizationPanelProps {
  prediction: PredictionResult;
  onClose: () => void;
}

export type TabId = "waveforms" | "importance" | "topomap";
