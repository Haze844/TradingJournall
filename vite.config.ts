import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'client'), // ✅ client als Root
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist/public'), // ✅ Output nach dist/public
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),      // ✅ z. B. @/components
      '@shared': path.resolve(__dirname, 'shared'),    // ✅ z. B. @shared/schema
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
});
