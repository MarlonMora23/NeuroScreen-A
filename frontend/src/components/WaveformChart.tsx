/**
 * WaveformChart.tsx
 *
 * Single-channel EEG waveform strip.
 *
 * Layout (horizontal, fixed columns so nothing overlaps):
 *  [channel label 52px] [y-axis 38px] [SVG flex-1] [time label 52px]
 *
 * The y-axis column shows yMax / cursor-value / yMin at top-center-bottom.
 * The cursor value replaces the "0" center label while hovering — it never
 * floats over the signal.
 */

import { useMemo } from "react";
import { SAMPLE_RATE } from "./useWaveformControls";

const W = 400;
const H = 56;
const PAD_V = 4; // top & bottom padding inside SVG
const INNER_H = H - PAD_V * 2;

interface WaveformChartProps {
  channelName: string;
  values: number[];
  windowStart: number;
  samplesVisible: number;
  color: string;
  importance?: number;
  /** null = auto per-channel y-scale */
  amplitudeScale: number | null;
  /** [0,1] fraction of the SVG width, or null */
  cursorFraction: number | null;
  onCursorMove: (f: number | null) => void;
}

export function WaveformChart({
  channelName,
  values,
  windowStart,
  samplesVisible,
  color,
  importance,
  amplitudeScale,
  cursorFraction,
  onCursorMove,
}: WaveformChartProps) {
  const totalSamples = values.length;
  const safeStart = Math.min(
    windowStart,
    Math.max(0, totalSamples - samplesVisible),
  );
  const visibleValues = values.slice(safeStart, safeStart + samplesVisible);

  // ── Y scale ───────────────────────────────────────────────────────────────
  const [yMin, yMax] = useMemo(() => {
    if (amplitudeScale !== null) return [-amplitudeScale, amplitudeScale];
    const sorted = [...values].sort((a, b) => a - b);
    let lo = sorted[Math.floor(sorted.length * 0.05)] ?? -1;
    let hi = sorted[Math.floor(sorted.length * 0.95)] ?? 1;
    if (hi - lo < 1e-6) {
      lo -= 1;
      hi += 1;
    }
    return [lo, hi];
  }, [values, amplitudeScale]); 
  const yRange = yMax - yMin;

  // ── Polyline ──────────────────────────────────────────────────────────────
  const n = visibleValues.length;
  const pts = visibleValues
    .map((v, i) => {
      const x = (i / Math.max(n - 1, 1)) * W;
      const vClamped = Math.max(yMin, Math.min(yMax, v));
      const y = PAD_V + (1 - (vClamped - yMin) / yRange) * INNER_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // ── Zero line ─────────────────────────────────────────────────────────────
  const zeroY = PAD_V + (1 - (0 - yMin) / yRange) * INNER_H;
  const showZero = zeroY >= PAD_V && zeroY <= H - PAD_V;

  // ── Cursor ────────────────────────────────────────────────────────────────
  const cursorSvgX = cursorFraction !== null ? cursorFraction * W : null;
  const cursorValue =
    cursorFraction !== null
      ? (visibleValues[Math.round(cursorFraction * (n - 1))] ?? null)
      : null;

  const startMs = ((safeStart / SAMPLE_RATE) * 1000).toFixed(0);
  const endMs = (((safeStart + samplesVisible) / SAMPLE_RATE) * 1000).toFixed(
    0,
  );

  return (
    <div className="flex items-stretch gap-0 py-1 px-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors group">
      {/* Channel label */}
      <div className="w-[52px] shrink-0 flex flex-col justify-center pr-1 select-none">
        <span className="text-[11px] font-mono font-semibold text-foreground/80 leading-none truncate">
          {channelName}
        </span>
        {importance !== undefined && (
          <div className="mt-1.5 w-full h-[3px] rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${importance * 100}%`, backgroundColor: color }}
            />
          </div>
        )}
      </div>

      {/* Y-axis: top=yMax, middle=cursor or zero, bottom=yMin — never overlaps chart */}
      <div className="w-[38px] shrink-0 flex flex-col justify-between items-end pr-1.5 py-[4px] select-none border-r border-border/10">
        <span className="text-[9px] font-mono text-muted-foreground/60 leading-none">
          {yMax.toFixed(1)}
        </span>
        {cursorValue !== null ? (
          <span
            className="text-[9px] font-mono font-semibold leading-none"
            style={{ color }}
          >
            {cursorValue.toFixed(2)}
          </span>
        ) : (
          <span className="text-[9px] font-mono text-muted-foreground/25 leading-none">
            ·
          </span>
        )}
        <span className="text-[9px] font-mono text-muted-foreground/60 leading-none">
          {yMin.toFixed(1)}
        </span>
      </div>

      {/* SVG chart */}
      <div
        className="flex-1 overflow-hidden cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onCursorMove(
            Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
          );
        }}
        onMouseLeave={() => onCursorMove(null)}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[52px] block"
        >
          {showZero && (
            <line
              x1={0}
              y1={zeroY}
              x2={W}
              y2={zeroY}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}
          <polyline
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {cursorSvgX !== null && (
            <line
              x1={cursorSvgX}
              y1={0}
              x2={cursorSvgX}
              y2={H}
              stroke="white"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          )}
        </svg>
      </div>

      {/* Time window — only on hover, right column */}
      <div className="w-[56px] shrink-0 flex items-center justify-end pl-1 select-none">
        <span className="text-[9px] font-mono text-muted-foreground/40 text-right leading-[1.3] opacity-0 group-hover:opacity-100 transition-opacity">
          {startMs}–{endMs}ms
        </span>
      </div>
    </div>
  );
}
