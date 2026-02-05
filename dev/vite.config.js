import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname),
    publicDir: path.resolve(__dirname, '..'),
    server: {
        open: true,
        host: true,
        headers: {
            'Cache-Control': 'no-store'
        }
    }
});
