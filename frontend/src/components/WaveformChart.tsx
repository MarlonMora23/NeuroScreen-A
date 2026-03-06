import { motion } from "framer-motion";

// ─── Waveform SVG Component ───────────────────────────────────────────────────

export function WaveformChart({
  channelName,
  values,
  timestamps,
  zoomLevel,
  color,
  importance,
}: {
  channelName: string;
  values: number[];
  timestamps: number[];
  zoomLevel: number;
  color: string;
  importance?: number;
}) {
  const W = 320;
  const H = 52;
  const PADDING = { top: 6, bottom: 6, left: 0, right: 0 };

  // Zoom: mostrar solo la fracción central del tiempo
  const totalSamples = values.length;
  const samplesVisible = Math.max(8, Math.round(totalSamples / zoomLevel));
  const startIdx = Math.floor((totalSamples - samplesVisible) / 2);
  const visibleValues = values.slice(startIdx, startIdx + samplesVisible);

  const min = Math.min(...visibleValues);
  const max = Math.max(...visibleValues);
  const range = max - min || 1;

  const pts = visibleValues
    .map((v, i) => {
      const x =
        PADDING.left +
        (i / (samplesVisible - 1)) * (W - PADDING.left - PADDING.right);
      const y =
        PADDING.top +
        (1 - (v - min) / range) * (H - PADDING.top - PADDING.bottom);
      return `${x},${y}`;
    })
    .join(" ");

  const durationLabel = `${(samplesVisible / 256).toFixed(2)}s`;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors group">
      {/* Channel label */}
      <div className="w-14 shrink-0">
        <span className="text-xs font-mono font-semibold text-foreground/80">
          {channelName}
        </span>
        {importance !== undefined && (
          <div className="mt-0.5 w-full h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${importance * 100}%`, backgroundColor: color }}
            />
          </div>
        )}
      </div>

      {/* SVG chart */}
      <div className="flex-1 overflow-hidden">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[52px]"
        >
          {/* Zero line */}
          <line
            x1={0}
            y1={H / 2}
            x2={W}
            y2={H / 2}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
          {/* Signal */}
          <polyline
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Duration */}
      <span className="text-[10px] font-mono text-muted-foreground w-9 text-right shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {durationLabel}
      </span>
    </div>
  );
}