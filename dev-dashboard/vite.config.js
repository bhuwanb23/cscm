import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + WebSocket calls to the Express control server
// (default :3002) so the React app runs with HMR during development.
const CONTROL_SERVER = process.env.DASHBOARD_URL || 'http://localhost:3002';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: CONTROL_SERVER, changeOrigin: true, ws: true },
      '/gateway': { target: CONTROL_SERVER, changeOrigin: true, ws: true },
    },
  },
  build: { outDir: 'dist' },
  // The page smoke tests render every route in jsdom. `vite build` resolves
  // identifiers at runtime, so a missing import produces a green build and a
  // page that throws on load - these tests are what catches that class.
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{jsx,js}'],
    setupFiles: ['./src/test/setup.js'],
  },
});
