import { motion } from "framer-motion";

const stats = [
  { value: "95.8%", label: "Precisión", sub: "Accuracy del modelo" },
  { value: "64", label: "Canales EEG", sub: "Electrodos activos" },
  { value: "<50ms", label: "Latencia", sub: "Tiempo de inferencia" },
  { value: "120+", label: "Sujetos", sub: "Dataset de entrenamiento" },
];

const Results = () => {
  return (
    <section id="resultados" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Resultados <span className="text-gradient">Comprobados</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Métricas clave del rendimiento de nuestro modelo de clasificación.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center hover:glow-primary transition-all"
            >
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</div>
              <div className="text-sm font-semibold mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Confusion matrix visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto mt-16 glass rounded-2xl p-8"
        >
          <h3 className="text-sm font-mono text-muted-foreground mb-6 text-center">MATRIZ DE CONFUSIÓN</h3>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-center text-sm">
            <div />
            <div className="text-xs text-muted-foreground font-mono pb-2">Predicho: Control</div>
            <div className="text-xs text-muted-foreground font-mono pb-2">Predicho: Alcohólico</div>

            <div className="text-xs text-muted-foreground font-mono pr-4 flex items-center">Real: Control</div>
            <div className="rounded-lg bg-success/20 text-success font-bold py-4">57</div>
            <div className="rounded-lg bg-destructive/20 text-destructive font-bold py-4">3</div>

            <div className="text-xs text-muted-foreground font-mono pr-4 flex items-center">Real: Alcohólico</div>
            <div className="rounded-lg bg-destructive/20 text-destructive font-bold py-4">2</div>
            <div className="rounded-lg bg-success/20 text-success font-bold py-4">58</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Results;
