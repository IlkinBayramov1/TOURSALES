import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/vendor/',
  plugins: [react()],
  resolve: {
    alias: {
      '@toursales/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@toursales/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
