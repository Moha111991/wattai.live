import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [VitePWA()],
  server: {
    allowedHosts: [
      'https://nodes-magnet-launch-higher.trycloudflare.com',
      'https://abs-kansas-cached-tutorial.trycloudflare.com',
      'https://lanka-wyoming-spanking-environmental.trycloudflare.com',
      'localhost',
    ],
    host: true,
    port: 5175
  }
});
