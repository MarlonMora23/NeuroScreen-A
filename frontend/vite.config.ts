import { defineConfig, loadEnv } from "vite";
import react from '@vitejs/plugin-react'
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno correctamente para el modo actual
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "VITE_");

  return {
    base: env.VITE_BASE || '/neuro/',
    envDir: path.resolve(__dirname, ".."),
    server: {
      allowedHosts: ['lidis.usbcali.edu.co', '.lidis.usbcali.edu.co'],
      host: "::",
      port: 8080,
      hmr: { overlay: false },
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  };
});