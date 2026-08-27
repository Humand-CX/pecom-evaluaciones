import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/postgrest': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['xlsx'],
      output: {
        globals: {
          xlsx: 'XLSX',
        },
      },
    },
  },
});
