/**
 * OverlayWaveformChart.tsx
 *
 * Renders multiple EEG channels overlaid in a single SVG with:
 *  - Y-axis column matching WaveformChart layout
 *  - Cursor value tooltip (channel → value) shown in a legend below the chart
 *  - Amplitude gain controlled by amplitudeScale
 *
 * Amplitude model (same as WaveformChart fixed-scale):
 *   Signals are z-score normalised → typical range ≈ [-3, +3].
 *   amplitudeScale is a gain divisor:
 *     - 1 → y-range = [-3, +3]   (default, signals fill ~80% of height)
 *     - 2 → y-range = [-6, +6]   (zoom out, signals appear smaller)
 *     - 0.5 → y-range = [-1.5, +1.5] (zoom in, signals may clip)
 */

import { SAMPLE_RATE } from "./useWaveformControls";
import { CHANNEL_GROUPS } from "./eeg-constants";

const W        = 400;
const H        = 160;
const PAD_V    = 8;
const INNER_H  = H - PAD_V * 2;
const ZSCORE_R = 3; // half-range for z-score signals

function getChannelColor(ch: string): string {
  if (CHANNEL_GROUPS.Frontal.includes(ch))   return "rgb(99,179,237)";
  if (CHANNEL_GROUPS.Central.includes(ch))   return "rgb(154,230,180)";
  if (CHANNEL_GROUPS.Parietal.includes(ch))  return "rgb(246,173,85)";
  if (CHANNEL_GROUPS.Occipital.includes(ch)) return "rgb(252,129,129)";
  if (CHANNEL_GROUPS.Temporal.includes(ch))  return "rgb(183,148,246)";
  return "rgb(160,174,192)";
}

interface OverlayWaveformChartProps {
  channels       : string[];
  data           : Record<string, number[]>;
  windowStart    : number;
  samplesVisible : number;
  /** Gain: 1=default, 2=zoom-out, 0.5=zoom-in */
  amplitudeScale : number;
  cursorFraction : number | null;
  onCursorMove   : (f: number | null) => void;
}

export function OverlayWaveformChart({
  channels,
  data,
  windowStart,
  samplesVisible,
  amplitudeScale,
  cursorFraction,
  onCursorMove,
}: OverlayWaveformChartProps) {
  const validChannels = channels.filter(
    (ch) => Array.isArray(data[ch]) && data[ch].length > 0
  );

  if (validChannels.length === 0) {
    return (
      <div className="rounded-lg bg-secondary/20 p-3 flex items-center justify-center h-[160px] text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  const totalSamples  = data[validChannels[0]].length;
  const safeStart     = Math.min(windowStart, Math.max(0, totalSamples - samplesVisible));

  // Fixed symmetric y-range based on amplitudeScale
  const yHalf = ZSCORE_R / amplitudeScale; // e.g. scale=2 → yHalf=1.5 (zoom out)

  function toSvgY(v: number): number {
    const clamped = Math.max(-yHalf, Math.min(yHalf, v));
    return PAD_V + (1 - (clamped + yHalf) / (2 * yHalf)) * INNER_H;
  }

  const cursorSvgX =
    cursorFraction !== null ? cursorFraction * W : null;

  const startMs = ((safeStart / SAMPLE_RATE) * 1000).toFixed(0);
  const endMs   = (((safeStart + samplesVisible) / SAMPLE_RATE) * 1000).toFixed(0);

  // Cursor values per channel for the legend
  const cursorValues: Record<string, number> = {};
  if (cursorFraction !== null) {
    for (const ch of validChannels) {
      const arr = data[ch].slice(safeStart, safeStart + samplesVisible);
      const idx = Math.round(cursorFraction * (arr.length - 1));
      cursorValues[ch] = arr[idx] ?? 0;
    }
  }

  return (
    <div className="rounded-lg bg-secondary/20 p-2 space-y-1">

      <div className="flex items-stretch gap-0">
        {/* Y-axis column */}
        <div className="w-[38px] shrink-0 flex flex-col justify-between items-end pr-1.5 py-[8px] select-none border-r border-border/10">
          <span className="text-[9px] font-mono text-muted-foreground/60 leading-none">
            +{yHalf.toFixed(1)}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/30 leading-none">0</span>
          <span className="text-[9px] font-mono text-muted-foreground/60 leading-none">
            -{yHalf.toFixed(1)}
          </span>
        </div>

        {/* SVG */}
        <div
          className="flex-1 cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onCursorMove(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
          }}
          onMouseLeave={() => onCursorMove(null)}
        >
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="block"
            style={{ height: "160px" }}
          >
            {/* Zero line */}
            <line
              x1={0} y1={H / 2} x2={W} y2={H / 2}
              stroke="currentColor" strokeOpacity={0.08}
              strokeWidth={1} strokeDasharray="4,4"
            />

            {validChannels.map((ch) => {
              const raw = data[ch].slice(safeStart, safeStart + samplesVisible);
              const n   = raw.length;
              const pts = raw
                .map((v, i) => {
                  const x = (i / Math.max(n - 1, 1)) * W;
                  return `${x.toFixed(1)},${toSvgY(v).toFixed(1)}`;
                })
                .join(" ");
              return (
                <polyline
                  key={ch}
                  points={pts}
                  fill="none"
                  stroke={getChannelColor(ch)}
                  strokeWidth={1.2}
                  strokeOpacity={0.85}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {cursorSvgX !== null && (
              <line
                x1={cursorSvgX} y1={0} x2={cursorSvgX} y2={H}
                stroke="white" strokeOpacity={0.25} strokeWidth={1}
              />
            )}
          </svg>
        </div>

        {/* Time label */}
        <div className="w-[48px] shrink-0 flex flex-col justify-between items-end pl-1 select-none py-[8px]">
          <span className="text-[9px] font-mono text-muted-foreground/40 leading-none">{startMs}ms</span>
          <span className="text-[9px] font-mono text-muted-foreground/40 leading-none">{endMs}ms</span>
        </div>
      </div>

      {/* Cursor readout — one row per channel, only shown while hovering */}
      {cursorFraction !== null && Object.keys(cursorValues).length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 pl-[38px] border-t border-border/10">
          {validChannels.map((ch) => (
            <span key={ch} className="flex items-center gap-1 text-[9px] font-mono">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: getChannelColor(ch) }}
              />
              <span className="text-muted-foreground/60">{ch}</span>
              <span style={{ color: getChannelColor(ch) }}>
                {cursorValues[ch].toFixed(2)}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Channel color legend (always visible) */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 pl-[38px]">
        {validChannels.map((ch) => (
          <span key={ch} className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: getChannelColor(ch) }}
            />
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}