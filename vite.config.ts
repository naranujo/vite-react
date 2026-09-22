/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SPA completamente client-side. Vercel solo sirve archivos estaticos.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Separar librerias pesadas para mejor cacheo y carga en paralelo.
        manualChunks: {
          tensorflow: ['@tensorflow/tfjs'],
          plotly: ['plotly.js-dist-min'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
