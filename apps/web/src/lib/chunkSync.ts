import { socket } from './socket';
import localforage from 'localforage';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB

// Setup localforage for IndexedDB large file storage
export const fileStorage = localforage.createInstance({
  name: 'NoteAntiGravity',
  storeName: 'files'
});

export const uploadFileInChunks = async (fileId: string, file: File) => {
  const totalSize = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  // 1. Save file locally first (Local-First)
  await fileStorage.setItem(fileId, file);

  // 2. Start sync process with server
  socket.emit('file_upload_start', {
    fileId,
    filename: file.name,
    totalSize,
    totalChunks,
    mimetype: file.type
  });

  return new Promise((resolve, reject) => {
    socket.on('file_upload_ready', ({ fileId: id }) => {
      if (id === fileId) {
        sendChunk(0);
      }
    });

    socket.on('file_chunk_ack', ({ fileId: id, nextChunk }) => {
      if (id === fileId) {
        if (nextChunk < totalChunks) {
          sendChunk(nextChunk);
        }
      }
    });

    socket.on('file_upload_complete', ({ fileId: id, url }) => {
      if (id === fileId) {
        socket.off('file_upload_ready');
        socket.off('file_chunk_ack');
        socket.off('file_upload_complete');
        resolve(url);
      }
    });

    socket.on('file_upload_error', ({ fileId: id, error }) => {
      if (id === fileId) {
        reject(error);
      }
    });

    const sendChunk = (chunkIndex: number) => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);

      const reader = new FileReader();
      reader.onload = () => {
        socket.emit('file_upload_chunk', {
          fileId,
          chunkIndex,
          chunkData: reader.result
        });
      };
      reader.readAsArrayBuffer(chunk);
    };
  });
};
