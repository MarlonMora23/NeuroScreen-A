import { useEffect, useRef, useState, useCallback } from "react";

// ─── Fake data config ───────────────────────────────────────────────────────
const SAMPLE_RATE = 256;       // Hz
const BUFFER_SECONDS = 8;      // seconds of pre-generated data
const BUFFER_SIZE = SAMPLE_RATE * BUFFER_SECONDS;
const VISIBLE_SECONDS = 2;
const SAMPLES_VISIBLE = SAMPLE_RATE * VISIBLE_SECONDS;

const CHANNELS = ["Fp1", "C3", "O2"];

const CHANNEL_COLORS = {
  Fp1: "rgb(99,179,237)",
  C3:  "rgb(154,230,180)",
  O2:  "rgb(241,144,164)",

};

// Generates a realistic-looking fake EEG signal for one channel
function generateFakeEEG(channelIndex) {
  const data = new Float32Array(BUFFER_SIZE);
  const freqDelta  = 2.0  + channelIndex * 0.3;
  const freqAlpha  = 10.0 + channelIndex * 0.5;
  const freqBeta   = 20.0 + channelIndex * 0.8;
  const ampDelta   = 1.4  - channelIndex * 0.1;
  const ampAlpha   = 0.8;
  const ampBeta    = 0.3;

  for (let i = 0; i < BUFFER_SIZE; i++) {
    const t = i / SAMPLE_RATE;
    const slow   = Math.sin(2 * Math.PI * freqDelta * t) * ampDelta;
    const alpha  = Math.sin(2 * Math.PI * freqAlpha * t + channelIndex) * ampAlpha;
    const beta   = Math.sin(2 * Math.PI * freqBeta  * t + channelIndex * 0.7) * ampBeta;
    const noise  = (Math.random() - 0.5) * 0.4;
    // Occasional spike artifact for realism
    const spike  = Math.random() < 0.001 ? (Math.random() - 0.5) * 6 : 0;
    data[i] = slow + alpha + beta + noise + spike;
  }

  // Z-score normalise so values are in ~[-3, +3] range
  let mean = 0;
  for (let i = 0; i < BUFFER_SIZE; i++) mean += data[i];
  mean /= BUFFER_SIZE;
  let std = 0;
  for (let i = 0; i < BUFFER_SIZE; i++) std += (data[i] - mean) ** 2;
  std = Math.sqrt(std / BUFFER_SIZE) || 1;
  for (let i = 0; i < BUFFER_SIZE; i++) data[i] = (data[i] - mean) / std;

  return Array.from(data);
}

// Pre-generate data once
const FAKE_DATA = {};
CHANNELS.forEach((ch, i) => { FAKE_DATA[ch] = generateFakeEEG(i); });

// ─── SVG dimensions ──────────────────────────────────────────────────────────
const W = 800;
const H = 180;
const PAD_V = 10;
const INNER_H = H - PAD_V * 2;
const ZSCORE_R = 3;
const Y_HALF = ZSCORE_R; // fixed amplitude

function toSvgY(v) {
  const clamped = Math.max(-Y_HALF, Math.min(Y_HALF, v));
  return PAD_V + (1 - (clamped + Y_HALF) / (2 * Y_HALF)) * INNER_H;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EEGSignalPreview() {
  const [windowStart, setWindowStart] = useState(0);
  const [cursorFraction, setCursorFraction] = useState(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const posRef = useRef(0); // float position in samples

  // Auto-scroll: advance ~32 samples/s (≈ 0.125s/s → 8x slow-mo for drama)
  const SCROLL_SPEED = 40; // samples per second of real time

  useEffect(() => {
    const animate = (ts) => {
      if (lastTimeRef.current == null) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;

      posRef.current = (posRef.current + SCROLL_SPEED * dt) %
        (BUFFER_SIZE - SAMPLES_VISIBLE);

      setWindowStart(Math.floor(posRef.current));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorFraction(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, []);

  const handleMouseLeave = useCallback(() => setCursorFraction(null), []);

  // Build polyline points for each channel
  const polylines = CHANNELS.map((ch) => {
    const slice = FAKE_DATA[ch].slice(windowStart, windowStart + SAMPLES_VISIBLE);
    const n = slice.length;
    const pts = slice
      .map((v, i) => `${((i / Math.max(n - 1, 1)) * W).toFixed(1)},${toSvgY(v).toFixed(1)}`)
      .join(" ");
    return { ch, pts };
  });

  // Cursor values
  const cursorValues = {};
  if (cursorFraction !== null) {
    CHANNELS.forEach((ch) => {
      const slice = FAKE_DATA[ch].slice(windowStart, windowStart + SAMPLES_VISIBLE);
      const idx = Math.round(cursorFraction * (slice.length - 1));
      cursorValues[ch] = (slice[idx] ?? 0).toFixed(2);
    });
  }

  const cursorSvgX = cursorFraction !== null ? cursorFraction * W : null;
  const startMs = ((windowStart / SAMPLE_RATE) * 1000).toFixed(0);
  const endMs   = (((windowStart + SAMPLES_VISIBLE) / SAMPLE_RATE) * 1000).toFixed(0);

  return (
    <div className="rounded-2xl overflow-hidden border border-border font-mono max-w-2xl mx-auto shadow-2xl mt-10 glass">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-[11px] font-bold text-foreground/85 tracking-widest">
            GRABACIÓN EEG
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground">256 Hz · 5ch</span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex items-stretch">

        {/* Y-axis */}
        <div className="w-10 flex flex-col justify-between items-end py-2.5 pr-2 border-r border-border shrink-0 select-none">
          <span className="text-[9px] text-muted-foreground/60">+{Y_HALF}</span>
          <span className="text-[9px] text-muted-foreground/40">0</span>
          <span className="text-[9px] text-muted-foreground/60">−{Y_HALF}</span>
        </div>

        {/* SVG waveform */}
        <div
          className="flex-1 cursor-crosshair relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="block h-[180px]"
          >
            {/* Background grid */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={0} y1={H * f} x2={W} y2={H * f}
                stroke="hsl(var(--muted))" strokeWidth={1}
              />
            ))}
            {Array.from({ length: 8 }, (_, i) => (i + 1) / 9).map((f) => (
              <line
                key={f}
                x1={W * f} y1={0} x2={W * f} y2={H}
                stroke="hsl(var(--muted)/0.7)" strokeWidth={1}
              />
            ))}

            {/* Zero line */}
            <line
              x1={0} y1={H / 2} x2={W} y2={H / 2}
              stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4"
            />

            {/* Channel waveforms */}
            {polylines.map(({ ch, pts }) => (
              <polyline
                key={ch}
                points={pts}
                fill="none"
                stroke={CHANNEL_COLORS[ch]}
                strokeWidth={1.3}
                strokeOpacity={0.82}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Cursor line */}
            {cursorSvgX !== null && (
              <line
                x1={cursorSvgX} y1={0} x2={cursorSvgX} y2={H}
                stroke="hsl(var(--foreground))" strokeOpacity={0.2} strokeWidth={1}
              />
            )}
          </svg>
        </div>

        {/* Time axis */}
        <div className="w-[52px] flex flex-col justify-between items-end py-2.5 px-3 select-none shrink-0">
          <span className="text-[9px] text-muted-foreground/60">{startMs}ms</span>
          <span className="text-[9px] text-muted-foreground/60">{endMs}ms</span>
        </div>
      </div>

      {/* Cursor readout */}
      <div className="min-h-7 flex items-center px-4 pl-14 border-t border-border gap-4 flex-wrap">
        {cursorFraction !== null
          ? CHANNELS.map((ch) => (
              <span key={ch} className="flex items-center gap-1.5 text-[9px]">
                <span
                  className="w-[7px] h-[7px] rounded-full inline-block"
                  style={{ background: CHANNEL_COLORS[ch] }}
                />
                <span className="text-muted-foreground">{ch}</span>
                <span style={{ color: CHANNEL_COLORS[ch] }}>{cursorValues[ch]}</span>
              </span>
            ))
          : CHANNELS.map((ch) => (
              <span key={ch} className="flex items-center gap-1.5 text-[9px]">
                <span
                  className="w-[7px] h-[7px] rounded-full inline-block opacity-60"
                  style={{ background: CHANNEL_COLORS[ch] }}
                />
                <span className="text-muted-foreground/60">{ch}</span>
              </span>
            ))
        }
      </div>

      {/* Footer */}
      <div className="flex justify-between px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
        <span>δ θ α β γ</span>
        <span className="text-destructive">Estado: Alcohólico</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}