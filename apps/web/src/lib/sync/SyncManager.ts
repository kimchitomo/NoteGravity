import localforage from 'localforage';
import { socket } from '../socket';
import { useTreeStore } from '../../store/useTreeStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface SyncJob {
  id: string;
  key: string;
  value: any;
  timestamp: number;
}

// Separate instance for queue storage
const queueStorage = localforage.createInstance({
  name: 'SyncQueueDB',
  storeName: 'jobs'
});

class SyncManagerClass {
  public static readonly instance = new SyncManagerClass();
  private isProcessingQueue = false;
  // This flag is CRITICAL. It prevents echoing updates back to the server.
  public isReceivingSync = false;

  private constructor() {
    this.initSocketListeners();
  }

  private initSocketListeners() {
    socket.on('connect', () => {
      console.log('[SyncManager] Connected to server:', socket.id);
      socket.emit('request_initial_sync');
      this.flushQueue();
    });

    socket.on('disconnect', () => {
      console.log('[SyncManager] Disconnected from server. Operating in offline mode.');
    });

    socket.on('initial_sync_data', async (data: Record<string, string>) => {
      console.log('[SyncManager] Received initial sync data:', Object.keys(data).length, 'keys');
      await this.applyServerUpdates(data);
    });

    socket.on('state_updated', async (data: { key: string; value: string }) => {
      await this.applyServerUpdates({ [data.key]: data.value });
    });

    // Handle case where socket is already connected before listeners are registered
    if (socket.connected) {
      console.log('[SyncManager] Socket already connected during initialization. Triggering sync.');
      socket.emit('request_initial_sync');
      this.flushQueue();
    }
  }

  private async applyServerUpdates(updates: Record<string, string>) {
    this.isReceivingSync = true;
    try {
      const sortedKeys = Object.keys(updates).sort((a, b) => {
        const priority = ['tree-store', 'workspace-storage', 'canvas-storage', 'history-store'];
        if (priority.includes(a) && !priority.includes(b)) return -1;
        if (!priority.includes(a) && priority.includes(b)) return 1;
        return 0;
      });

      for (const key of sortedKeys) {
        const serverContent = updates[key];
        
        if (key.startsWith('note-content-')) {
          // Avoid overwriting valid content with empty strings/placeholders
          if (!serverContent || serverContent === '<p></p>' || serverContent.trim() === '') {
            continue;
          }
          await localforage.setItem(key, serverContent);
          window.dispatchEvent(new CustomEvent('external-note-update', { detail: { key, content: serverContent } }));
        } else {
          const existing = localStorage.getItem(key);
          if (existing !== serverContent) {
            localStorage.setItem(key, serverContent);
            // Notify Zustand stores that data has changed in localStorage
            window.dispatchEvent(new StorageEvent('storage', { key, newValue: serverContent }));
            
            // Dispatch a custom event to notify stores to hydrate
            window.dispatchEvent(new CustomEvent('sync-hydrate', { detail: { key, state: serverContent } }));

            // Direct in-place state update to ensure UI re-renders immediately
            try {
              const parsed = JSON.parse(serverContent);
              if (key === 'tree-store') {
                if (parsed.state) {
                  const state = parsed.state;
                  useTreeStore.setState({
                    ...state,
                    expandedIds: new Set(state.expandedIds || []),
                    hiddenIds: new Set(state.hiddenIds || []),
                    pinnedIds: new Set(state.pinnedIds || []),
                    lockedIds: new Set(state.lockedIds || []),
                  });
                }
              } else if (key === 'canvas-storage' && parsed.state) {
                useCanvasStore.setState(parsed.state);
              } else if (key === 'workspace-storage' && parsed.state) {
                useWorkspaceStore.setState(parsed.state);
              }
            } catch (e) {
              console.error('[SyncManager] Failed to apply in-place store state update:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('[SyncManager] Error applying server updates:', err);
    } finally {
      // Small timeout ensures that all synchronous React updates and Zustand subscribers
      // finish executing before we unlock the sync engine.
      setTimeout(() => {
        this.isReceivingSync = false;
      }, 50);
    }
  }

  /**
   * Push an update to the sync queue.
   * If online, it flushes immediately. Otherwise, it stays in IndexedDB.
   */
  public async pushUpdate(key: string, value: any) {
    if (this.isReceivingSync) return; // Prevent echo

    // Validation for Tiptap placeholder content
    if (key.startsWith('note-content-')) {
      const strValue = typeof value === 'string' ? value : '';
      if (!strValue || strValue === '<p></p>' || strValue === '<p>Bắt đầu nhập nội dung tại đây...</p>' || strValue.trim() === '') {
        return; // Refuse to sync placeholder text
      }
      // Save locally first
      await localforage.setItem(key, value);
    } else {
      // LocalStorage saves are handled by Zustand persist automatically.
    }

    const job: SyncJob = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      key,
      value,
      timestamp: Date.now()
    };

    await queueStorage.setItem(job.id, job);
    
    // Attempt to flush if online
    if (socket.connected) {
      this.flushQueue();
    }
  }

  private async flushQueue() {
    if (this.isProcessingQueue || !socket.connected) return;
    this.isProcessingQueue = true;

    try {
      const keys = await queueStorage.keys();
      if (keys.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      console.log(`[SyncManager] Flushing ${keys.length} items to server...`);
      
      const jobs: SyncJob[] = [];
      for (const key of keys) {
        const job = await queueStorage.getItem<SyncJob>(key);
        if (job) jobs.push(job);
      }

      // Sort by oldest first
      jobs.sort((a, b) => a.timestamp - b.timestamp);

      // We can send all at once to a new batch endpoint
      socket.emit('batch_update_state', jobs, async (ack: { success: boolean }) => {
        if (ack?.success) {
          // If server acknowledged, clean up queue
          for (const job of jobs) {
            await queueStorage.removeItem(job.id);
          }
          console.log('[SyncManager] Queue flushed successfully.');
        } else {
          console.warn('[SyncManager] Server did not acknowledge batch update. Will retry later.');
        }
      });
      
    } catch (err) {
      console.error('[SyncManager] Error flushing queue:', err);
    } finally {
      this.isProcessingQueue = false;
    }
  }
}

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key: string, value: string) {
  const existing = localStorage.getItem(key);
  if (existing === value) return;

  originalSetItem.apply(this, [key, value]);
  
  const isSyncableKey = ['tree-store', 'canvas-storage', 'workspace-storage'].includes(key);
  
  if (isSyncableKey && !SyncManagerClass.instance.isReceivingSync) {
    SyncManagerClass.instance.pushUpdate(key, value);
  }
};

export const SyncManager = SyncManagerClass.instance;
(window as any).SyncManager = SyncManager;
