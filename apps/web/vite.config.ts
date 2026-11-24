import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev: API runs with `pnpm --filter @preppal/api dev` on :8787
    proxy: { '/api': 'http://localhost:8787' },
  },
});
