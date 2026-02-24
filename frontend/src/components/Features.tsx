import { motion } from "framer-motion";
import {
  Shield,
  Clock,
  Database,
  LineChart,
  BrainCircuit,
  Microscope,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Arquitectura EEGNet",
    description:
      "Red neuronal diseñada específicamente para el análisis eficiente de señales electroencefalográficas.",
  },
  {
    icon: Shield,
    title: "Alto Desempeño",
    description:
      "Precisión cercana al 90% y AUC superior a 0.96 en validación independiente.",
  },
  {
    icon: Clock,
    title: "Inferencia Rápida",
    description:
      "Procesamiento completo en menos de un minuto por registro EEG.",
  },
  {
    icon: Database,
    title: "Dataset Científico",
    description:
      "Entrenado con 11,057 muestras provenientes de 122 sujetos del dataset EEG for Alcoholism.",
  },
  {
    icon: LineChart,
    title: "Análisis Espacio-Temporal",
    description:
      "Modela simultáneamente la dimensión temporal y la distribución espacial de 34 canales EEG.",
  },
  {
    icon: Microscope,
    title: "No Invasivo",
    description:
      "Basado en electroencefalografía de superficie, técnica segura y ampliamente utilizada en investigación clínica.",
  },
];

const Features = () => {
  return (
    <section id="caracteristicas" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Características <span className="text-gradient">Clave</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tecnología de punta para un diagnóstico preciso y accesible.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group cursor-default"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
