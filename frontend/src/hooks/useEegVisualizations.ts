import { useState, useEffect, useCallback } from "react";
import { eegService, VisualizationResponse } from "@/services/eeg-service";

export function useEegVisualizations(
  eegRecordId: string | null,
  predictionStatus: string
) {
  const [vizData, setVizData] = useState<VisualizationResponse | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [vizLoading, setVizLoading] = useState(false);
  const [vizError, setVizError] = useState<string | null>(null);

  useEffect(() => {
    if (!eegRecordId || predictionStatus !== "processed") return;

    let cancelled = false;
    setVizLoading(true);

    const poll = async () => {
      try {
        const res = await eegService.getVisualization(
          eegRecordId,
          "topomap,channel_importance",
          []  // no aplica para estos tipos
        );

        if (cancelled) return;

        if (res.status === "completed") {
          setVizData(res);
          setVizLoading(false);

          // Pre-seleccionar los 4 canales más importantes
          if (res.channel_importance) {
            const { channels, importance } = res.channel_importance;
            const top4 = channels
              .map((ch, i) => ({ ch, imp: importance[i] }))
              .sort((a, b) => b.imp - a.imp)
              .slice(0, 4)
              .map((x) => x.ch);
            setSelectedChannels(top4);
          }
        } else if (res.status === "pending" || res.status === "processing") {
          setTimeout(poll, 3000);
        } else if (res.status === "failed") {
          setVizError(res.error_msg ?? "Visualization generation failed");
          setVizLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setVizError(err instanceof Error ? err.message : "Unknown error");
          setVizLoading(false);
        }
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [eegRecordId, predictionStatus]);

  // Lazy-load waveforms al seleccionar canales
  const fetchWaveforms = useCallback(async (channels: string[]) => {
    if (!eegRecordId || channels.length === 0) return;

    try {
      const res = await eegService.getVisualization(eegRecordId, "waveforms", channels);
      if (res.status === "completed" && res.waveforms) {
        setVizData((prev) => prev ? { ...prev, waveforms: res.waveforms } : prev);
      }
    } catch (err) {
      console.error("Failed to fetch waveforms:", err);
    }
  }, [eegRecordId]);

  return {
    vizData,
    vizLoading,
    vizError,
    selectedChannels,
    setSelectedChannels,
    fetchWaveforms,
  };
}