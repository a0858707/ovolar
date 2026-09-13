import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'games.ovolar.app',
  appName: 'Ovolar',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
