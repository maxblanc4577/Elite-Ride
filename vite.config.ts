import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
  },
  envPrefix: ['VITE_'],
  define: {
    'process.env.STRIPE_SECRET_KEY': 'undefined',
    'process.env.GEMINI_API_KEY': 'undefined',
    'process.env.STRIPE_WEBHOOK_SECRET': 'undefined',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            return 'vendor-ui';
          }
        },
      },
    },
  },
});
