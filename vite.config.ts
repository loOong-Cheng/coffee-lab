import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base + hash routing => the built `dist/` works from any static host or sub-path.
// Babylon.js is only imported (dynamically) by the /xr route, so it lands in a lazy chunk.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    target: 'es2022',
    sourcemap: true,
    // The lazy XR chunk (Babylon) is legitimately large; the entry chunk is what we keep small.
    chunkSizeWarningLimit: 4000,
  },
});
