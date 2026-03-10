import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  Brain,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { eegService, VisualizationResponse } from "@/services/eeg-service";
import {
  ALL_CHANNELS,
  CHANNEL_GROUPS,
  ZOOM_LEVELS,
  EegVisualizationPanelProps,
  TabId,
} from "./eeg-constants";
import { TopoMap } from "./TopoMap";
import { ChannelImportanceChart } from "./ChannelImportanceChart";
import { WaveformsTabContent } from "./WaveformsTabContent";
import { useWaveformControls } from "./useWaveformControls";

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function EegVisualizationPanel({
  prediction,
  onClose,
}: EegVisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("importance");
  const [vizData, setVizData] = useState<VisualizationResponse | null>(null);
  const [vizLoading, setVizLoading] = useState(true);
  const [vizError, setVizError] = useState<string | null>(null);

  // Channel selection for waveforms
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [channelSearch, setChannelSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Frontal");

  // Waveforms lazy loading
  const [waveformsLoading, setWaveformsLoading] = useState(false);

  // ── Load topomap + importance on mount ──
  useEffect(() => {
    let cancelled = false;
    setVizLoading(true);

    const poll = async () => {
      try {
        const res = await eegService.getVisualization(
          prediction.eeg_record_id,
          "topomap,channel_importance",
          [],
        );
        if (cancelled) return;

        if (res.status === "completed") {
          setVizData(res);
          setVizLoading(false);
          // Pre-select top 6 channels
          if (res.channel_importance) {
            const { channels, importance } = res.channel_importance;
            const top6 = channels
              .map((ch, i) => ({ ch, imp: importance[i] }))
              .sort((a, b) => b.imp - a.imp)
              .slice(0, 6)
              .map((x) => x.ch);
            setSelectedChannels(top6);
          }
        } else if (res.status === "pending" || res.status === "processing") {
          setTimeout(poll, 3000);
        } else if (res.status === "failed") {
          setVizError(res.error_msg ?? "Error al generar visualizaciones");
          setVizLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setVizError(err instanceof Error ? err.message : "Error desconocido");
          setVizLoading(false);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [prediction.eeg_record_id]);

  // ── Fetch waveforms when tab is activated or channel selection changes ──
  const fetchWaveforms = useCallback(
    async (channels: string[]) => {
      if (channels.length === 0) return;
      setWaveformsLoading(true);
      try {
        const res = await eegService.getVisualization(
          prediction.eeg_record_id,
          "waveforms",
          channels,
        );
        if (res.status === "completed" && res.waveforms) {
          setVizData((prev) =>
            prev ? { ...prev, waveforms: res.waveforms } : prev,
          );
        }
      } catch (err) {
        console.error("Failed to fetch waveforms:", err);
      } finally {
        setWaveformsLoading(false);
      }
    },
    [prediction.eeg_record_id],
  );

  useEffect(() => {
    if (activeTab === "waveforms" && selectedChannels.length > 0) {
      fetchWaveforms(selectedChannels);
    }
  }, [activeTab, selectedChannels, fetchWaveforms]);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const toggleGroupChannels = (group: string) => {
    const groupChs = CHANNEL_GROUPS[group];
    const allSelected = groupChs.every((ch) => selectedChannels.includes(ch));
    if (allSelected) {
      setSelectedChannels((prev) =>
        prev.filter((ch) => !groupChs.includes(ch)),
      );
    } else {
      setSelectedChannels((prev) => [...new Set([...prev, ...groupChs])]);
    }
  };

  const getChannelColor = (ch: string) => {
    if (CHANNEL_GROUPS.Frontal.includes(ch)) return "rgb(99,179,237)";
    if (CHANNEL_GROUPS.Central.includes(ch)) return "rgb(154,230,180)";
    if (CHANNEL_GROUPS.Parietal.includes(ch)) return "rgb(246,173,85)";
    if (CHANNEL_GROUPS.Occipital.includes(ch)) return "rgb(252,129,129)";
    if (CHANNEL_GROUPS.Temporal.includes(ch)) return "rgb(183,148,246)";
    return "rgb(160,174,192)";
  };

  const getImportance = (ch: string) => {
    if (!vizData?.channel_importance) return undefined;
    const idx = vizData.channel_importance.channels.indexOf(ch);
    return idx >= 0 ? vizData.channel_importance.importance[idx] : undefined;
  };

  const filteredChannels = channelSearch
    ? ALL_CHANNELS.filter((ch) =>
        ch.toLowerCase().includes(channelSearch.toLowerCase()),
      )
    : null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "importance",
      label: "Importancia",
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: "topomap",
      label: "Topomap",
      icon: <Brain className="w-3.5 h-3.5" />,
    },
    {
      id: "waveforms",
      label: "Waveforms",
      icon: <Activity className="w-3.5 h-3.5" />,
    },
  ];

  const totalSamples = vizData?.waveforms
    ? (Object.values(vizData.waveforms.channels)[0]?.length ?? 0)
    : 0;

  const {
    zoomIdx,
    setZoomIdx,
    zoomAvailable,
    samplesVisible,
    windowStart,
    isPlaying,
    togglePlay,
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
  } = useWaveformControls(totalSamples);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-border/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Análisis de Interpretabilidad EEG
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">
                    Paciente #
                    {prediction.patient_identification_number || "N/A"}
                  </span>
                  <span className="text-border/60">·</span>
                  {prediction.result === "alcoholic" ? (
                    <Badge
                      variant="outline"
                      className="text-xs h-4 px-1.5 bg-destructive/15 text-destructive border-destructive/30 gap-1"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> Alcohólico
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs h-4 px-1.5 bg-success/15 text-success border-success/30 gap-1"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" /> No Alcohólico
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs h-4 px-1.5">
                    {(prediction.confidence * 100).toFixed(1)}% confianza
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 px-6 py-3 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-hidden px-6">
            {vizLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-sm">Generando visualizaciones...</span>
              </div>
            ) : vizError ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <span className="text-sm">{vizError}</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* ── Importance Tab ── */}
                {activeTab === "importance" && (
                  <motion.div
                    key="importance"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-y-auto pb-4"
                  >
                    <div className="flex items-center gap-2 mb-4 px-2">
                      <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Método usado: {vizData.channel_importance.method}.
                        Valores cercanos a 1 indican mayor influencia en la
                        clasificación.
                      </p>
                    </div>
                    {vizData?.channel_importance ? (
                      <ChannelImportanceChart
                        channels={vizData.channel_importance.channels}
                        importance={vizData.channel_importance.importance}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No disponible
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Topomap Tab ── */}
                {activeTab === "topomap" && (
                  <motion.div
                    key="topomap"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="h-full overflow-y-auto"
                  >
                    <div className="flex items-center gap-2 px-2">
                      <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Distribución espacial de la importancia de canales sobre
                        el cuero cabelludo. Hover sobre un electrodo para ver
                        detalles.
                      </p>
                    </div>
                    <div className="flex justify-center pt-16">
                      {vizData?.topomap?.electrodes ? (
                        <TopoMap electrodes={vizData.topomap.electrodes} />
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No disponible
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Waveforms Tab ── */}
                {activeTab === "waveforms" && (
                  <motion.div
                    key="waveforms"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 pb-4 px-2">
                        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Selecciona los canales que deseas visualizar.
                        </p>
                      </div>
                      {/* Left: Channel selector */}
                      <div id="content" className="flex flex-1 overflow-hidden">
                        <div className="w-62 border-r border-border/30 flex flex-col shrink-0">
                          <div className="pr-3 pt-3 pb-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground/80">
                                Canales
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {selectedChannels.length}/{ALL_CHANNELS.length}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar canal..."
                              value={channelSearch}
                              onChange={(e) => setChannelSearch(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded-md bg-secondary/40 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  setSelectedChannels([...ALL_CHANNELS])
                                }
                                className="flex-1 text-[11px] py-1 rounded bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Todos
                              </button>
                              <button
                                onClick={() => setSelectedChannels([])}
                                className="flex-1 text-[11px] py-1 rounded bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Ninguno
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto pr-2 pb-3">
                            {filteredChannels ? (
                              // Search results: flat list
                              <div className="space-y-0.5">
                                {filteredChannels.map((ch) => {
                                  const imp = getImportance(ch);
                                  return (
                                    <button
                                      key={ch}
                                      onClick={() => toggleChannel(ch)}
                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                                        selectedChannels.includes(ch)
                                          ? "bg-primary/10 text-primary"
                                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                                      }`}
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: getChannelColor(ch),
                                        }}
                                      />
                                      <span className="font-mono font-medium">
                                        {ch}
                                      </span>
                                      {imp !== undefined && (
                                        <span className="ml-auto text-[11px] opacity-60">
                                          {imp.toFixed(2)}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              // Grouped
                              Object.entries(CHANNEL_GROUPS).map(
                                ([group, chs]) => {
                                  const allSel = chs.every((ch) =>
                                    selectedChannels.includes(ch),
                                  );
                                  const someSel = chs.some((ch) =>
                                    selectedChannels.includes(ch),
                                  );
                                  const isOpen = expandedGroup === group;
                                  return (
                                    <div key={group} className="mb-1">
                                      <button
                                        onClick={() =>
                                          setExpandedGroup(
                                            isOpen ? null : group,
                                          )
                                        }
                                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-secondary/40 transition-colors group"
                                      >
                                        <div
                                          className="w-2 h-2 rounded-sm shrink-0"
                                          style={{
                                            backgroundColor: getChannelColor(
                                              chs[0],
                                            ),
                                          }}
                                        />
                                        <span className="text-xs font-medium text-foreground/70 flex-1 text-left">
                                          {group}
                                        </span>
                                        <span
                                          className={`text-[11px] ${someSel ? "text-primary" : "text-muted-foreground"}`}
                                        >
                                          {
                                            chs.filter((ch) =>
                                              selectedChannels.includes(ch),
                                            ).length
                                          }
                                          /{chs.length}
                                        </span>
                                        {isOpen ? (
                                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                        )}
                                      </button>

                                      <AnimatePresence>
                                        {isOpen && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                              height: "auto",
                                              opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                          >
                                            <div
                                              className="pl-1 mb-1 cursor-pointer"
                                              onClick={() =>
                                                toggleGroupChannels(group)
                                              }
                                            >
                                              <span className="text-[11px] px-2 py-0.5 rounded text-muted-foreground hover:text-primary transition-colors">
                                                {allSel
                                                  ? "Deseleccionar grupo"
                                                  : "Seleccionar grupo"}
                                              </span>
                                            </div>
                                            <div className="space-y-0.5 pl-1">
                                              {chs.map((ch) => {
                                                const imp = getImportance(ch);
                                                return (
                                                  <button
                                                    key={ch}
                                                    onClick={() =>
                                                      toggleChannel(ch)
                                                    }
                                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                                                      selectedChannels.includes(
                                                        ch,
                                                      )
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                                                    }`}
                                                  >
                                                    <span className="font-mono">
                                                      {ch}
                                                    </span>
                                                    {imp !== undefined && (
                                                      <span className="ml-auto text-[11px] opacity-50">
                                                        {imp.toFixed(2)}
                                                      </span>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                },
                              )
                            )}
                          </div>
                        </div>

                        {/* Right: Waveform charts */}
                        <WaveformsTabContent
                          selectedChannels={selectedChannels}
                          waveformsLoading={waveformsLoading}
                          waveforms={vizData?.waveforms}
                          getImportance={getImportance}
                          zoomIdx={zoomIdx}
                          setZoomIdx={setZoomIdx}
                          zoomAvailable={zoomAvailable}
                          samplesVisible={samplesVisible}
                          windowStart={windowStart}
                          isPlaying={isPlaying}
                          togglePlay={togglePlay}
                          speedIdx={speedIdx}
                          setSpeedIdx={setSpeedIdx}
                          ampIdx={ampIdx}
                          handleSetAmpIdx={handleSetAmpIdx}
                          amplitudeScale={amplitudeScale}
                          cursorFraction={cursorFraction}
                          setCursorFraction={setCursorFraction}
                          overlayMode={overlayMode}
                          setOverlayMode={setOverlayMode}
                          scrubberFraction={scrubberFraction}
                          scrubTo={scrubTo}
                          attachWheelRef={attachWheelRef}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 border-t border-border/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>
                Modelo:{" "}
                <span className="font-mono">{prediction.model_version}</span>
              </span>
              <span className="text-border/50">·</span>
              <span>256 Hz · 34 canales </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
