import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Brain } from "lucide-react";
import EEGWave from "../eeg/EEGWave";
import EEGSignalPreview from "../eeg/EEGSignalPreview";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen pt-28 sm:pt-40 md:pt-16 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <EEGWave className="top-[20%]" delay={0} />
        <EEGWave className="top-[40%]" delay={1} />
        <EEGWave className="top-[60%]" delay={2} />
        <EEGWave className="top-[80%]" delay={0.5} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6">
            Detección Temprana{" "}
            <br />
            de <span className="text-gradient">Alcoholismo</span>
            <br />
            mediante señales{" "}
            <span className="text-primary">EEG</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-7 sm:mb-10 leading-relaxed px-2 sm:px-0">
            Utilizamos <strong className="text-foreground">Redes Neuronales Convolucionales</strong> para
            analizar patrones electroencefalográficos y detectar indicadores
            de trastorno por consumo de alcohol con alta precisión.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <motion.a
              href="#como-funciona"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg glow-primary transition-all"
            >
              <Brain className="w-5 h-5" />
              Explorar Metodología
            </motion.a>
            <motion.a
              href="#resultados"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl glass text-foreground font-semibold text-base sm:text-lg hover:border-primary/50 transition-all"
            >
              Ver Resultados
            </motion.a>
          </div>
        </motion.div>

        <EEGSignalPreview />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
        >
          <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;