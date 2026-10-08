import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Les variables VITE_* sont lues dans le .env à la racine du dépôt.
  envDir: '../..',
  // Chemins relatifs : nécessaire pour la WebView Android.
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION ?? '1.0.0'),
  },
  // Firebase pèse l'essentiel du paquet ; il est embarqué dans l'APK, donc pas téléchargé.
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1200 },
});
