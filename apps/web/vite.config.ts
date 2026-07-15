import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import https from 'https';

let lastTtsError = '';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      clientPort: 5173,
    },
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../../192.168.0.194-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../192.168.0.194.pem')),
    },
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../../192.168.0.194-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../192.168.0.194.pem')),
    },
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true
      },
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024 // 50MB
      },
      manifest: {
        name: 'NoteAntiGravity',
        short_name: 'NoteGravity',
        description: 'Local-first note taking app with real-time sync',
        theme_color: '#ffffff',
        display: 'standalone',
        share_target: {
          action: '/share-receive',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'media',
                accept: ['image/*', 'video/*', 'audio/*', 'text/*']
              }
            ]
          }
        },
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    {
      name: 'tts-proxy',
      configureServer(server) {
        server.middlewares.use('/api/tts_debug', (req, res) => {
          res.end(lastTtsError || 'No error');
        });
        
        server.middlewares.use('/api/tts', (req, res) => {
          try {
            const url = new URL(req.originalUrl || req.url || '', `http://${req.headers.host}`);
            const googleUrl = `https://translate.googleapis.com/translate_tts${url.search}`;
            
            const clientReq = https.get(googleUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            }, (googleRes) => {
              const headersToForward = { ...googleRes.headers };
              delete headersToForward['access-control-allow-origin'];
              delete headersToForward['transfer-encoding'];
              delete headersToForward['connection'];
              delete headersToForward['keep-alive'];
              delete headersToForward['upgrade'];
              
              res.writeHead(googleRes.statusCode || 200, headersToForward);
              googleRes.pipe(res);

              // Ngăn server bị sập khi client ngắt kết nối đột ngột
              res.on('error', () => googleRes.destroy());
              req.on('close', () => googleRes.destroy());
              googleRes.on('error', () => res.end());
            });

            clientReq.on('error', (e) => {
              lastTtsError = 'Network Error: ' + e.message;
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end(e.message);
              }
            });
          } catch (err: any) {
            lastTtsError = 'Setup Error: ' + err.message;
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(err.message);
            }
          }
        });
      }
    }
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  }
});
