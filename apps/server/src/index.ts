import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import db, { uploadsDir } from './db';
import fs from 'fs';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allows access from LAN or Tailscale IPs easily
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e7 // Allow large chunks up to 50MB
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the uploaded directory
app.use('/uploads', express.static(uploadsDir));

app.get('/api/tts', (req, res) => {
  try {
    const url = new URL(req.originalUrl || req.url || '', `http://${req.headers.host}`);
    const googleUrl = `https://translate.googleapis.com/translate_tts${url.search}`;
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const https = require('https');
    https.get(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (googleRes: any) => {
      const headersToForward = { ...googleRes.headers };
      delete headersToForward['access-control-allow-origin'];
      
      res.writeHead(googleRes.statusCode || 200, headersToForward);
      googleRes.pipe(res);
    }).on('error', (e: any) => {
      res.status(500).send(e.message);
    });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Serve the web client if in production (Docker container)
const webDistPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  console.log('Serving static web app from:', webDistPath);
  app.use(express.static(webDistPath));
  
  // Catch-all to serve index.html for React Router / PWA
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/uploads') || req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Map to hold incomplete file chunks
const fileChunks = new Map<string, { totalChunks: number; chunksReceived: number; fd: number; path: string }>();

// Lưu trữ thời gian request cuối cùng của mỗi IP
const syncRateLimits = new Map<string, number>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 1. Initial Sync Request
  socket.on('request_initial_sync', () => {
    const clientIp = socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
    const clientKey = `${clientIp}-${userAgent}`;
    
    const now = Date.now();
    const lastRequest = syncRateLimits.get(clientKey) || 0;

    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.startsWith('192.168.');
    
    // Nếu Thiết bị này vừa request trong vòng 2 giây qua (và không phải local bypass), trả về rỗng để chặn vòng lặp reload
    if (!isLocal && now - lastRequest < 2000) {
      console.log(`Rate limiting initial_sync_data for ${clientKey}`);
      socket.emit('initial_sync_data', {});
      return;
    }
    syncRateLimits.set(clientKey, now);

    // Thêm delay 500ms để đảm bảo các lệnh update_state (nếu có) được ghi vào SQLite xong trước khi đọc ra
    setTimeout(() => {
      // Send all state back to the requesting client
      db.all(`SELECT key, value FROM state`, (err, rows) => {
        if (err) {
          console.error('Failed to fetch state for initial sync:', err);
          return;
        }
        const stateObj: Record<string, string> = {};
        rows.forEach((row: any) => {
          stateObj[row.key] = row.value;
        });
        socket.emit('initial_sync_data', stateObj);
      });
    }, 500);
  });

  // 2. State Sync Update
  // When a client modifies state (like dragging a node, typing text), it broadcasts here
  socket.on('update_state', (data: { key: string; value: string }) => {
    // Save to SQLite
    db.run(
      `INSERT INTO state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [data.key, data.value],
      (err) => {
        if (err) {
          console.error('Failed to save state:', err);
          return;
        }
        // Broadcast the update to ALL OTHER connected clients
        socket.broadcast.emit('state_updated', { key: data.key, value: data.value });
      }
    );
  });

  // Offline-First Sync Engine: Receive a batch of changes from a reconnected client
  socket.on('batch_update_state', (jobs: { id: string; key: string; value: any; timestamp: number }[], callback) => {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      if (typeof callback === 'function') callback({ success: true });
      return;
    }

    console.log(`[Sync] Received batch of ${jobs.length} updates from ${socket.id}`);

    // Execute in a transaction for performance and consistency
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const stmt = db.prepare(
        `INSERT INTO state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      );

      jobs.forEach(job => {
        stmt.run([job.key, job.value]);
      });

      stmt.finalize();
      
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('[Sync] Batch transaction failed:', err);
          db.run('ROLLBACK');
          if (typeof callback === 'function') callback({ success: false });
        } else {
          // Acknowledge success to client
          if (typeof callback === 'function') callback({ success: true });
          
          // Broadcast all changes to other clients
          jobs.forEach(job => {
            socket.broadcast.emit('state_updated', { key: job.key, value: job.value });
          });
        }
      });
    });
  });

  // 3. File Upload Chunking (WebSockets)
  socket.on('file_upload_start', (data: { fileId: string; filename: string; totalSize: number; totalChunks: number; mimetype: string }) => {
    const filePath = path.join(uploadsDir, data.fileId);
    // Open file descriptor for writing chunks
    fs.open(filePath, 'w', (err, fd) => {
      if (err) {
        console.error('Failed to open file for chunk writing:', err);
        socket.emit('file_upload_error', { fileId: data.fileId, error: 'Cannot open file' });
        return;
      }
      
      fileChunks.set(data.fileId, {
        totalChunks: data.totalChunks,
        chunksReceived: 0,
        fd,
        path: filePath
      });
      
      // Save metadata to SQLite
      db.run(`INSERT OR IGNORE INTO files (id, filename, mimetype, size) VALUES (?, ?, ?, ?)`, 
        [data.fileId, data.filename, data.mimetype, data.totalSize]);

      // Request client to start sending chunks
      socket.emit('file_upload_ready', { fileId: data.fileId });
    });
  });

  socket.on('file_upload_chunk', (data: { fileId: string; chunkIndex: number; chunkData: Buffer }) => {
    const fileInfo = fileChunks.get(data.fileId);
    if (!fileInfo) return;

    // Write chunk sequentially (Assuming chunks arrive in order for now, 
    // or we can use positional writes if needed: fs.write(fd, buffer, 0, buffer.length, position))
    fs.write(fileInfo.fd, data.chunkData, 0, data.chunkData.length, null, (err) => {
      if (err) {
        console.error('Error writing chunk:', err);
        return;
      }
      
      fileInfo.chunksReceived++;
      
      if (fileInfo.chunksReceived === fileInfo.totalChunks) {
        // All chunks received
        fs.close(fileInfo.fd, () => {
          fileChunks.delete(data.fileId);
          console.log(`File upload complete: ${data.fileId}`);
          
          // Notify the uploader it's done
          socket.emit('file_upload_complete', { fileId: data.fileId, url: `/uploads/${data.fileId}` });
          
          // Broadcast to OTHER clients to start pulling or just notify them it's available
          socket.broadcast.emit('new_file_available', { fileId: data.fileId, url: `/uploads/${data.fileId}` });
        });
      } else {
        // Request next chunk
        socket.emit('file_chunk_ack', { fileId: data.fileId, nextChunk: fileInfo.chunksReceived });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});
