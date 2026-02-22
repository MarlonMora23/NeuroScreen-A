import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Circle } from "lucide-react";

const CHANNELS = ["Fp1", "Fp2", "F3", "F4", "C3", "C4"];
const COLORS = [
  "hsl(185, 80%, 55%)",
  "hsl(260, 60%, 60%)",
  "hsl(160, 70%, 45%)",
  "hsl(185, 80%, 40%)",
  "hsl(260, 60%, 45%)",
  "hsl(160, 70%, 55%)",
];

const generatePoint = (t: number, channelIndex: number) => {
  const freq1 = 0.8 + channelIndex * 0.3;
  const freq2 = 2.1 + channelIndex * 0.5;
  const freq3 = 8 + channelIndex * 1.2;
  return (
    Math.sin(t * freq1) * 12 +
    Math.sin(t * freq2) * 8 +
    Math.sin(t * freq3) * 3 +
    (Math.random() - 0.5) * 6
  );
};

const EEGSignalPreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dataRef = useRef<number[][]>(CHANNELS.map(() => Array(200).fill(0)));
  const tRef = useRef(0);
  const [isRecording] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, W, H);

      // grid lines
      ctx.strokeStyle = "hsl(220, 15%, 12%)";
      ctx.lineWidth = 0.5;
      for (let y = 0; y < H; y += H / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      tRef.current += 0.08;

      CHANNELS.forEach((_, ci) => {
        const newVal = generatePoint(tRef.current, ci);
        dataRef.current[ci].push(newVal);
        if (dataRef.current[ci].length > 200) dataRef.current[ci].shift();

        const channelH = H / CHANNELS.length;
        const baseY = channelH * ci + channelH / 2;

        ctx.strokeStyle = COLORS[ci];
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();

        const data = dataRef.current[ci];
        const step = W / (data.length - 1);
        data.forEach((val, i) => {
          const x = i * step;
          const y = baseY + val;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="w-full max-w-2xl mx-auto mt-12"
    >
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-semibold text-foreground">EEG EN VIVO</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground">256 Hz · 64ch</span>
            {isRecording && (
              <div className="flex items-center gap-1">
                <Circle className="w-2 h-2 fill-destructive text-destructive animate-pulse-glow" />
                <span className="text-[10px] font-mono text-destructive">REC</span>
              </div>
            )}
          </div>
        </div>

        {/* Canvas + Labels */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-52 sm:h-60"
            style={{ display: "block" }}
          />
          {/* Channel labels */}
          <div className="absolute left-2 top-0 h-full flex flex-col justify-around py-2 pointer-events-none">
            {CHANNELS.map((ch, i) => (
              <span
                key={ch}
                className="text-[9px] font-mono font-semibold leading-none"
                style={{ color: COLORS[i] }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Footer metrics */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 text-[10px] font-mono text-muted-foreground">
          <span>Banda: δ θ α β γ</span>
          <span>Latencia: 12ms</span>
          <span className="text-success">Estado: Normal</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EEGSignalPreview;
