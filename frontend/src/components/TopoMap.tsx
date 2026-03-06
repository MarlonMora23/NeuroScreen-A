import { useState } from "react";

// ─── Topomap Component ────────────────────────────────────────────────────────

export function TopoMap({
  electrodes,
}: {
  electrodes: Array<{ name: string; x: number; y: number; importance: number }>;
}) {
  const SIZE = 420;
  const R = 180;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  const [hovered, setHovered] = useState<string | null>(null);

  const getColor = (importance: number) => {
    // cool → warm gradient: blue(low) → cyan → green → yellow → red(high)
    const t = Math.max(0, Math.min(1, importance));
    if (t < 0.25) {
      const u = t / 0.25;
      return `rgb(${Math.round(30 + u * 0)}, ${Math.round(80 + u * 120)}, ${Math.round(200 + u * 55)})`;
    } else if (t < 0.5) {
      const u = (t - 0.25) / 0.25;
      return `rgb(${Math.round(30 + u * 30)}, ${Math.round(200 + u * 55)}, ${Math.round(255 - u * 155)})`;
    } else if (t < 0.75) {
      const u = (t - 0.5) / 0.25;
      return `rgb(${Math.round(60 + u * 195)}, ${Math.round(255 - u * 55)}, ${Math.round(100 - u * 100)})`;
    } else {
      const u = (t - 0.75) / 0.25;
      return `rgb(${Math.round(255)}, ${Math.round(200 - u * 200)}, ${Math.round(0)})`;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={SIZE} height={SIZE} className="overflow-visible">
        {/* Head outline */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={2}
        />
        {/* Nose */}
        <path
          d={`M ${CX - 8} ${CY - R + 4} L ${CX} ${CY - R - 14} L ${CX + 8} ${CY - R + 4}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={2}
        />
        {/* Ears */}
        <path
          d={`M ${CX - R - 2} ${CY - 8} Q ${CX - R - 14} ${CY} ${CX - R - 2} ${CY + 8}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={2}
        />
        <path
          d={`M ${CX + R + 2} ${CY - 8} Q ${CX + R + 14} ${CY} ${CX + R + 2} ${CY + 8}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={2}
        />

        {/* Reference lines */}
        <line
          x1={CX}
          y1={CY - R}
          x2={CX}
          y2={CY + R}
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeWidth={1}
        />
        <line
          x1={CX - R}
          y1={CY}
          x2={CX + R}
          y2={CY}
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeWidth={1}
        />

        {/* Electrodes */}
        {electrodes.map((el) => {
          const px = CX + el.x * R;
          const py = CY - el.y * R;
          const color = getColor(el.importance);
          const isHovered = hovered === el.name;
          const radius = isHovered ? 12 : 10;

          return (
            <g
              key={el.name}
              onMouseEnter={() => setHovered(el.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={px}
                cy={py}
                r={radius + 3}
                fill={color}
                fillOpacity={0.2}
                className="transition-all duration-150"
              />
              <circle
                cx={px}
                cy={py}
                r={radius}
                fill={color}
                fillOpacity={isHovered ? 1 : 0.85}
                stroke="white"
                strokeWidth={isHovered ? 1.5 : 1}
                className="transition-all duration-150"
              />
              {(isHovered || el.importance > 0.7) && (
                <text
                  x={px}
                  y={py - radius - 4}
                  textAnchor="middle"
                  fontSize={12}
                  fill="currentColor"
                  fillOpacity={0.9}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {el.name}
                </text>
              )}
              {isHovered && (
                <text
                  x={px}
                  y={py + radius + 12}
                  textAnchor="middle"
                  fontSize={12}
                  fill={color}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {el.importance.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 w-[280px]">
        <span className="text-[10px] text-muted-foreground font-mono">
          Bajo
        </span>
        <div
          className="flex-1 h-3 rounded-full"
          style={{
            background:
              "linear-gradient(to right, rgb(30,80,200), rgb(30,200,255), rgb(60,255,100), rgb(255,200,0), rgb(255,0,0))",
          }}
        />
        <span className="text-[10px] text-muted-foreground font-mono">
          Alto
        </span>
      </div>
    </div>
  );
}