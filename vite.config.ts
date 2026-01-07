import { defineConfig } from 'vite';

// For GitHub Pages, use repository name as base path
// Change this if your repository name is different
const REPO_NAME = 'three-js-first-person-pacman';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});

