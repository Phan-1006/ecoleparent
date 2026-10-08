import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Les variables VITE_* sont lues dans le .env à la racine du dépôt.
  envDir: '../..',
  build: { target: 'es2022', chunkSizeWarningLimit: 1400 },
});
