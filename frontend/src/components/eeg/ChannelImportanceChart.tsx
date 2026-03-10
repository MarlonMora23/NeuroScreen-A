import { motion } from "framer-motion";
import { CHANNEL_GROUPS } from "./eeg-constants";

// ─── Channel Importance Bar Chart ─────────────────────────────────────────────

export function ChannelImportanceChart({
  channels,
  importance,
}: {
  channels: string[];
  importance: number[];
}) {
  const sorted = channels
    .map((ch, i) => ({ ch, imp: importance[i] }))
    .sort((a, b) => b.imp - a.imp);

  const getGroupColor = (ch: string) => {
    if (CHANNEL_GROUPS.Frontal.includes(ch)) return "rgb(99,179,237)";
    if (CHANNEL_GROUPS.Central.includes(ch)) return "rgb(154,230,180)";
    if (CHANNEL_GROUPS.Parietal.includes(ch)) return "rgb(246,173,85)";
    if (CHANNEL_GROUPS.Occipital.includes(ch)) return "rgb(252,129,129)";
    if (CHANNEL_GROUPS.Temporal.includes(ch)) return "rgb(183,148,246)";
    return "rgb(160,174,192)";
  };

  return (
    <div className="space-y-1.5 pr-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 px-2">
        {Object.entries(CHANNEL_GROUPS).map(([group]) => (
          <div key={group} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: getGroupColor(
                  Object.values(CHANNEL_GROUPS)
                    .flat()
                    .find((ch) => CHANNEL_GROUPS[group].includes(ch)) ?? "",
                ),
              }}
            />
            <span className="text-[11px] text-muted-foreground">{group}</span>
          </div>
        ))}
      </div>

      {sorted.map(({ ch, imp }, idx) => (
        <div key={ch} className="flex items-center gap-2 group">
          <span className="text-[12px] font-mono w-12 text-right text-foreground/70 shrink-0">
            {ch}
          </span>
          <div className="flex-1 h-5 bg-secondary/30 rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${imp * 100}%` }}
              transition={{
                duration: 0.5,
                delay: idx * 0.015,
                ease: "easeOut",
              }}
              className="h-full rounded-sm flex items-center justify-end pr-1.5"
              style={{ backgroundColor: getGroupColor(ch) }}
            >
              {imp > 0.15 && (
                <span className="text-[10px] font-mono font-bold text-black/90">
                  {imp.toFixed(2)}
                </span>
              )}
            </motion.div>
          </div>
          {imp <= 0.15 && (
            <span className="text-[10px] font-mono text-muted-foreground w-7 shrink-0">
              {imp.toFixed(2)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}