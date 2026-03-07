/**
 * WaveformsTabContent.tsx
 *
 * Toolbar + scrubber + chart area for the waveforms tab.
 * Receives all state from useWaveformControls — no local state here.
 */

import React from "react";
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaveformChart } from "./WaveformChart";
import { OverlayWaveformChart } from "./OverlayWaveformChart";
import { WaveformData } from "@/services/eeg-service";
import { CHANNEL_GROUPS } from "./eeg-constants";
import {
  ZOOM_LEVELS_S,
  ZOOM_LABELS,
  AMP_OPTIONS,
  SPEED_OPTIONS,
  SPEED_LABELS,
} from "./useWaveformControls";

function getChannelColor(ch: string): string {
  if (CHANNEL_GROUPS.Frontal.includes(ch)) return "rgb(99,179,237)";
  if (CHANNEL_GROUPS.Central.includes(ch)) return "rgb(154,230,180)";
  if (CHANNEL_GROUPS.Parietal.includes(ch)) return "rgb(246,173,85)";
  if (CHANNEL_GROUPS.Occipital.includes(ch)) return "rgb(252,129,129)";
  if (CHANNEL_GROUPS.Temporal.includes(ch)) return "rgb(183,148,246)";
  return "rgb(160,174,192)";
}

interface WaveformsTabContentProps {
  selectedChannels: string[];
  waveformsLoading: boolean;
  waveforms: WaveformData | undefined;
  getImportance: (ch: string) => number | undefined;

  // from useWaveformControls
  zoomIdx: number;
  setZoomIdx: (i: number) => void;
  zoomAvailable: readonly boolean[];
  samplesVisible: number;

  windowStart: number;

  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  speedIdx: number;
  setSpeedIdx: (i: number) => void;

  ampIdx: number;
  handleSetAmpIdx: (i: number) => void;
  amplitudeScale: number | null;

  cursorFraction: number | null;
  setCursorFraction: (v: number | null) => void;

  overlayMode: boolean;
  setOverlayMode: (v: boolean) => void;

  scrubberFraction: number;
  scrubTo: (f: number) => void;
  attachWheelRef: (el: HTMLDivElement | null) => void;
}

export function WaveformsTabContent({
  selectedChannels,
  waveformsLoading,
  waveforms,
  getImportance,
  zoomIdx,
  setZoomIdx,
  zoomAvailable,
  samplesVisible,
  windowStart,
  isPlaying,
  setIsPlaying,
  speedIdx,
  setSpeedIdx,
  ampIdx,
  handleSetAmpIdx,
  amplitudeScale,
  cursorFraction,
  setCursorFraction,
  overlayMode,
  setOverlayMode,
  scrubberFraction,
  scrubTo,
  attachWheelRef,
}: WaveformsTabContentProps) {
  // ── Toolbar ───────────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 shrink-0">
      {/* LEFT: Zoom + Amplitude */}
      <div className="flex items-center gap-6">
        {/* Zoom */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground select-none">
            Zoom
          </span>

          <div className="flex items-center gap-0.5 bg-secondary/40 rounded-lg p-0.5">
            {(ZOOM_LABELS as readonly string[]).map((label, i) => (
              <button
                key={label}
                disabled={!zoomAvailable[i]}
                onClick={() => setZoomIdx(i)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  zoomIdx === i
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Amplitude */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground select-none">
            Amp
          </span>

          <div className="flex items-center gap-0.5 bg-secondary/40 rounded-lg p-0.5">
            {AMP_OPTIONS.map(({ label }, i) => (
              <button
                key={label}
                onClick={() => handleSetAmpIdx(i)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono transition-colors ${
                  ampIdx === i
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: View controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={overlayMode ? "default" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs gap-1"
          onClick={() => setOverlayMode(!overlayMode)}
        >
          <Layers className="w-3.5 h-3.5" />
          Overlay
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            setZoomIdx(ZOOM_LEVELS_S.length - 4);
            handleSetAmpIdx(0);
            setCursorFraction(null);
          }}
          title="Reiniciar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  // ── Scrubber + playback ───────────────────────────────────────────────────
  const scrubber = (
    <div className="flex items-center gap-3 px-5 py-2 border-b border-border/10 shrink-0">
      {/* Play */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 shrink-0"
        title={isPlaying ? "Pause" : "Play"}
        onClick={() => setIsPlaying(!isPlaying)}
        disabled={zoomIdx === 0}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      {/* Timeline */}
      <input
        type="range"
        disabled={zoomIdx === 0}
        min={0}
        max={1}
        step={0.001}
        value={scrubberFraction}
        onChange={(e) => scrubTo(parseFloat(e.target.value))}
        className="flex-1 h-1.5 accent-primary cursor-pointer"
      />

      {/* Speed */}
      <div className="flex items-center gap-0.5 bg-secondary/40 rounded-lg p-0.5 shrink-0">
        {(SPEED_LABELS as readonly string[]).map((label, i) => (
          <button
            key={label}
            onClick={() => setSpeedIdx(i)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors ${
              speedIdx === i
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Empty / loading ───────────────────────────────────────────────────────
  const empty = (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <Activity className="w-8 h-8 opacity-30" />
      <p className="text-sm">Selecciona canales para visualizar</p>
    </div>
  );

  const spinner = (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <p className="text-xs">Cargando señales...</p>
    </div>
  );

  // ── Charts ────────────────────────────────────────────────────────────────
  const charts = waveforms && (
    <div ref={attachWheelRef} className="space-y-1">
      {overlayMode ? (
        <OverlayWaveformChart
          channels={selectedChannels}
          data={waveforms.channels}
          windowStart={windowStart}
          samplesVisible={samplesVisible}
          amplitudeScale={amplitudeScale ?? 1}
          cursorFraction={cursorFraction}
          onCursorMove={setCursorFraction}
        />
      ) : (
        selectedChannels.map((ch) => {
          const chData = waveforms.channels[ch];
          if (!chData) return null;
          return (
            <WaveformChart
              key={ch}
              channelName={ch}
              values={chData}
              windowStart={windowStart}
              samplesVisible={samplesVisible}
              color={getChannelColor(ch)}
              importance={getImportance(ch)}
              amplitudeScale={amplitudeScale}
              cursorFraction={cursorFraction}
              onCursorMove={setCursorFraction}
            />
          );
        })
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {toolbar}
      {scrubber}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {selectedChannels.length === 0 ? (
          empty
        ) : waveformsLoading ? (
          spinner
        ) : waveforms ? (
          charts
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Sin datos de waveform
          </div>
        )}
      </div>
    </div>
  );
}
