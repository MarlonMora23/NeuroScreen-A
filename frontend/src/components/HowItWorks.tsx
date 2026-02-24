import { motion } from "framer-motion";
import { Waves, Cpu, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Waves,
    title: "Adquisición EEG",
    description:
      "Se analiza un segmento de 1 segundo de actividad cerebral capturada mediante electroencefalografía no invasiva.",
    detail: "34 canales · 256 muestras",
    color: "primary" as const,
  },
  {
    icon: Cpu,
    title: "Análisis con IA",
    description:
      "Una red neuronal especializada en señales cerebrales identifica patrones espacio-temporales asociados al consumo crónico de alcohol.",
    detail: "Arquitectura EEGNet",
    color: "accent" as const,
  },
  {
    icon: BarChart3,
    title: "Clasificación Clínica",
    description:
      "El sistema estima la probabilidad de pertenecer al grupo Control o Alcohólico con métricas validadas científicamente.",
    detail: "AUC: 0.96+",
    color: "success" as const,
  },
];

const colorMap = {
  primary: "text-primary border-primary/30 bg-primary/10",
  accent: "text-accent border-accent/30 bg-accent/10",
  success: "text-success border-success/30 bg-success/10",
};

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            ¿Cómo <span className="text-gradient">funciona</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Un pipeline de inteligencia artificial transforma señales EEG en una
            estimación objetiva basada en evidencia científica.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8 h-full hover:border-primary/30 transition-colors group">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${colorMap[step.color]}`}
                >
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-2">
                  PASO {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {step.description}
                </p>
                <div className="font-mono text-xs text-primary/80 glass rounded-lg px-3 py-2 inline-block">
                  {step.detail}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
