/**
 * Alternative Vite-Konfiguration für Render-Deployment
 * ACHTUNG: Diese Datei wird nur für das Render-Deployment verwendet!
 */
const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist'), // <-- Geändert: Kein /public mehr!
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
});