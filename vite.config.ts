import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site from https://leoninni.github.io/winter-village/,
// so the production build needs that base path. Locally (dev, dev:phone) it's '/'.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/winter-village/' : '/',
  server: { port: 5173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000, // Phaser itself is ~1.5 MB; that's expected
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
