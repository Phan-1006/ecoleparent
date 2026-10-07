import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.parentecole.app',
  appName: 'ParentEcole',
  webDir: 'dist',
  android: {
    // Firebase Auth a besoin d'un schéma https pour la WebView.
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#f4f5f0',
      style: 'LIGHT',
    },
  },
};

export default config;
