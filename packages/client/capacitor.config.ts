import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.domino.online',
  appName: 'Dominó Online',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  android: {
    backgroundColor: '#f9faf5',
  },
};

export default config;
