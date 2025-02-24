import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/NewApp.jsx',
                'resources/js/index.jsx',
                'resources/css/app.css',
                'resources/css/styles.css',
                'resources/css/scroll.css',
            ],
            refresh: true,
        }),
        react(),
    ],
    build: {
        outDir: 'public/build',
        assetsDir: '',
        manifest: true,
        minify: 'esbuild',
        target: 'esnext',
        worker: true, 
        threads: 4,   
    },
});
