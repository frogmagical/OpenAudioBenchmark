import { defineConfig } from 'vitest/config';

// Relative base so the static build also works from a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
});
