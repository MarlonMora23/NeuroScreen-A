import { motion } from "framer-motion";
import { Waves, Cpu, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Waves,
    title: "Adquisición EEG",
    description: "Se capturan señales electroencefalográficas de 64 canales del cuero cabelludo del paciente.",
    detail: "64 canales · 256 Hz",
    color: "primary" as const,
  },
  {
    icon: Cpu,
    title: "Procesamiento CNN",
    description: "La red neuronal convolucional analiza patrones espacio-temporales en las señales EEG.",
    detail: "Conv1D · BatchNorm · Dropout",
    color: "accent" as const,
  },
  {
    icon: BarChart3,
    title: "Clasificación",
    description: "El modelo clasifica al sujeto como alcohólico o control con alta precisión diagnóstica.",
    detail: "Precisión > 95%",
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
            Un pipeline de tres etapas transforma señales cerebrales en diagnósticos precisos.
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
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${colorMap[step.color]}`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-2">PASO {i + 1}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{step.description}</p>
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
