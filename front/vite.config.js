import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.EMF_API_TARGET || 'http://localhost:5001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: { '/api': apiTarget }
  }
});
