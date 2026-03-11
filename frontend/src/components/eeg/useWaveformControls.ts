/**
 * useWaveformControls.ts
 * Centralizes all waveform navigation / playback state.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export const SAMPLE_RATE = 256;

// Zoom levels expressed as seconds of signal visible.
// Clamped at runtime to totalSamples / SAMPLE_RATE so levels > recording
// duration are simply disabled in the UI.
export const ZOOM_LEVELS_S = [1.0, 0.5, 0.25, 0.125] as const;
export const ZOOM_LABELS    = ["1s", "½s", "¼s", "⅛s"] as const;

// Amplitude gain options. null = auto per-channel.
export const AMP_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Auto", value: null  },
  { label: "×½",   value: 0.5  },
  { label: "×1",   value: 1    },
  { label: "×2",   value: 2    },
  { label: "×4",   value: 4    },
];

// Playback speeds that make sense for ≤1s recordings.
export const SPEED_OPTIONS = [0.01, 0.1, 0.25, 0.5] as const;
export const SPEED_LABELS  = ["0.01×", "0.1×", "0.25×", "0.5×"] as const;

export function useWaveformControls(totalSamples: number) {
  // ── Zoom ─────────────────────────────────────────────────────────────────
  // Default: show the full recording (last valid index)
  const defaultZoomIdx = 0;
  const [zoomIdx, setZoomIdx] = useState(defaultZoomIdx);

  const durationS  = totalSamples / SAMPLE_RATE;           // e.g. 1.0 s
  const windowS    = Math.min(ZOOM_LEVELS_S[zoomIdx], durationS);
  const samplesVisible = Math.round(windowS * SAMPLE_RATE);
  const maxStart   = Math.max(0, totalSamples - samplesVisible);

  // A zoom level is available only when its window fits in the recording
  const zoomAvailable = ZOOM_LEVELS_S.map((s) => s <= durationS);

  // ── Window navigation ─────────────────────────────────────────────────────
  const [windowStart, setWindowStart] = useState(0);

  // Clamp when zoom changes so we never overrun the buffer
  useEffect(() => {
    setWindowStart((prev) => Math.min(prev, maxStart));
  }, [maxStart]);

  // ── Amplitude ─────────────────────────────────────────────────────────────
  const [amplitudeScale, setAmplitudeScale] = useState<number | null>(null);
  const [ampIdx, setAmpIdx] = useState(0); // index into AMP_OPTIONS

  const handleSetAmpIdx = useCallback((i: number) => {
    setAmpIdx(i);
    setAmplitudeScale(AMP_OPTIONS[i].value);
  }, []);

  // ── Playback ──────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying]   = useState(false);
  const [speedIdx,  setSpeedIdx]    = useState(0);          // default 0.01×
  const playSpeed = SPEED_OPTIONS[speedIdx];

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || maxStart === 0) return; // nothing to play

    // How many samples to advance per 30ms tick so playback matches real-time × speed
    // real-time: 256 samples / 1000ms → 256 * 0.03 = 7.68 samples/tick @ 1×
    const STEP = Math.max(1, Math.round(playSpeed * SAMPLE_RATE * 0.03));

    intervalRef.current = setInterval(() => {
      setWindowStart((prev) => {
        const next = prev + STEP;
        if (next >= maxStart) {
          setIsPlaying(false);
          return maxStart;
        }
        return next;
      });
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // playSpeed is intentionally in the dep array so speed changes restart the interval
  }, [isPlaying, maxStart, playSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cursor ────────────────────────────────────────────────────────────────
  const [cursorFraction, setCursorFraction] = useState<number | null>(null);

  // ── Overlay ───────────────────────────────────────────────────────────────
  const [overlayMode, setOverlayMode] = useState(false);

  // ── Wheel scroll (passive:false so we can preventDefault) ────────────────
  const chartsRef = useRef<HTMLDivElement | null>(null);

  // Stable ref so the callback identity never changes
  const maxStartRef = useRef(maxStart);
  useEffect(() => { maxStartRef.current = maxStart; }, [maxStart]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.shiftKey) return; // only scroll when Shift is held (to avoid interfering with normal page scroll)
    e.preventDefault();
    const step = Math.max(4, Math.round(SAMPLE_RATE * 0.03)); // ~30ms per notch
    setWindowStart((prev) =>
      Math.max(0, Math.min(maxStartRef.current, prev + (e.deltaY > 0 ? step : -step)))
    );
  }, []);

  const attachWheelRef = useCallback((el: HTMLDivElement | null) => {
    if (chartsRef.current) {
      chartsRef.current.removeEventListener("wheel", handleWheel as EventListener);
    }
    chartsRef.current = el;
    if (el) {
      el.addEventListener("wheel", handleWheel as EventListener, { passive: false });
    }
  }, [handleWheel]);

  // ── Scrubber ──────────────────────────────────────────────────────────────
  const scrubTo = useCallback((fraction: number) => {
    setWindowStart(Math.round(fraction * maxStartRef.current));
  }, []);

  const scrubberFraction = maxStart > 0 ? windowStart / maxStart : 0;

  // ── Toggle play ───────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (windowStart >= maxStart) {
        setWindowStart(0);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, windowStart, maxStart]);

  return {
    // zoom
    zoomIdx, setZoomIdx, zoomAvailable, windowS, samplesVisible,
    // navigation
    windowStart, maxStart,
    // amplitude
    ampIdx, handleSetAmpIdx, amplitudeScale,
    // playback
    isPlaying, togglePlay, speedIdx, setSpeedIdx, playSpeed,
    // cursor
    cursorFraction, setCursorFraction,
    // overlay
    overlayMode, setOverlayMode,
    // wheel + scrubber
    attachWheelRef, scrubberFraction, scrubTo,
  };
}