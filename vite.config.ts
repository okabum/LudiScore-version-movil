import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Asegura que los assets carguen correctamente en cualquier subruta
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});