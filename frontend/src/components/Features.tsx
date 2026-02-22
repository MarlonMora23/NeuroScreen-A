import { motion } from "framer-motion";
import { Shield, Clock, Database, LineChart, BrainCircuit, Microscope } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "CNN Especializada",
    description: "Arquitectura de red neuronal optimizada para el análisis de series temporales EEG.",
  },
  {
    icon: Shield,
    title: "Alta Precisión",
    description: "Tasa de clasificación superior al 95% validada con cross-validation.",
  },
  {
    icon: Clock,
    title: "Tiempo Real",
    description: "Procesamiento y clasificación de señales EEG en milisegundos.",
  },
  {
    icon: Database,
    title: "Dataset UCI",
    description: "Entrenado con el dataset de alcoholismo EEG de UCI Machine Learning Repository.",
  },
  {
    icon: LineChart,
    title: "Visualización",
    description: "Mapas topográficos y espectrogramas de actividad cerebral en tiempo real.",
  },
  {
    icon: Microscope,
    title: "No Invasivo",
    description: "Técnica completamente no invasiva basada en electroencefalografía de superficie.",
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
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
