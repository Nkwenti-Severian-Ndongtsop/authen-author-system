import { defineConfig } from 'vite';
import { resolve } from 'path';
import * as sass from 'sass';

export default defineConfig({
    root: '.',
    server: {
        port: 5173,
        open: true
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    optimizeDeps: {
        include: ['@auth/ts-client']
    },
    resolve: {
        alias: {
            '@auth/ts-client': resolve(__dirname, '../ts-client/dist')
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                implementation: sass,
                sassOptions: {
                    api: 'modern',
                    style: 'expanded',
                    sourceMap: true
                }
            }
        }
    }
}); 