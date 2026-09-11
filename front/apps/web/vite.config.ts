import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const redirectTrailingSlashPlugin = () => ({
  name: 'redirect-trailing-slash',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url || '';
      if (url === '/vendor' || url.startsWith('/vendor?')) {
        res.writeHead(302, { Location: '/vendor/' });
        return res.end();
      }
      if (url === '/admin' || url.startsWith('/admin?')) {
        res.writeHead(302, { Location: '/admin/' });
        return res.end();
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), redirectTrailingSlashPlugin()],
  resolve: {
    alias: {
      '@toursales/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@toursales/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/vendor': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        ws: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:5175',
        changeOrigin: true,
        ws: true,
      },
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
