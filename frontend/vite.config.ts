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
    resolve: {
        alias: {
            'ts-client': resolve(__dirname, '../ts-client')
        }
    }
}); 