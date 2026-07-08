import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

let lastTtsError = '';

export default defineConfig({
  plugins: [
    react(),
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
            
            https.get(googleUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            }, (googleRes) => {
              const headersToForward = { ...googleRes.headers };
              delete headersToForward['access-control-allow-origin'];
              
              res.writeHead(googleRes.statusCode || 200, headersToForward);
              googleRes.pipe(res);
            }).on('error', (e) => {
              lastTtsError = 'Network Error: ' + e.message;
              res.statusCode = 500;
              res.end(e.message);
            });
          } catch (err: any) {
            lastTtsError = 'Setup Error: ' + err.message;
            res.statusCode = 500;
            res.end(err.message);
          }
        });
      }
    }
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  }
});
