import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src',
    server: {
        port: 5173,
        open: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    optimizeDeps: {
        include: ['../../ts-client/dist/index.js']
    }
}); 