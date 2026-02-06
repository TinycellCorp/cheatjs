import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';
import path from 'path';

export default defineConfig(function(env) {
    var isServe = env.command === 'serve';
    return {
        root: path.resolve(__dirname),
        publicDir: isServe ? path.resolve(__dirname, '..') : false,
        base: isServe ? '/' : '/cheatjs/',
        build: {
            outDir: path.resolve(__dirname, '../dist-preview'),
            emptyOutDir: true
        },
        plugins: [{
            name: 'copy-cheat-js',
            writeBundle: function() {
                copyFileSync(
                    path.resolve(__dirname, '../cheat.js'),
                    path.resolve(__dirname, '../dist-preview/cheat.js')
                );
            }
        }],
        server: {
            open: true,
            host: true,
            headers: {
                'Cache-Control': 'no-store'
            }
        }
    };
});
