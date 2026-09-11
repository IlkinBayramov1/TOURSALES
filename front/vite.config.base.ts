import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';

export const baseViteConfig: UserConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      '@toursales/types': resolve(__dirname, 'packages/types/src/index.ts'),
      '@toursales/ui': resolve(__dirname, 'packages/ui/src/index.ts'),
    },
  },
};
