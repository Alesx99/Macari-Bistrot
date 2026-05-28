import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In sviluppo: il frontend gira su :5173 e fa proxy verso il backend su :4000.
// In produzione locale (USB): il backend serve direttamente la cartella dist/.
// In produzione online (GitHub Pages): base path = nome del repository.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Macari-Bistrot/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
